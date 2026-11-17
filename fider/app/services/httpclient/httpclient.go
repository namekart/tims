package httpclient

import (
	"context"
	"errors"
	"io"
	"net"
	"net/http"
	"net/netip"
	"syscall"
	"time"

	"github.com/getfider/fider/app/models/cmd"
	"github.com/getfider/fider/app/pkg/bus"
	"github.com/getfider/fider/app/pkg/env"
)

func init() {
	http.DefaultClient = &http.Client{
		Timeout: 30 * time.Second,
		CheckRedirect: func(req *http.Request, via []*http.Request) error {
			return http.ErrUseLastResponse
		},
	}
	bus.Register(Service{})
}

// Internal ranges that netip still reports as global unicast.
var nonPublicPrefixes = []netip.Prefix{
	netip.MustParsePrefix("0.0.0.0/8"),     // this host
	netip.MustParsePrefix("100.64.0.0/10"), // shared address space: carrier NAT, VPN overlays, metadata endpoints
	netip.MustParsePrefix("192.0.0.0/24"),  // protocol assignments, includes metadata endpoints
	// IPv6 translation and tunnel prefixes that embed an IPv4 address, such as 10.0.0.1 or 127.0.0.1
	netip.MustParsePrefix("64:ff9b::/96"),
	netip.MustParsePrefix("64:ff9b:1::/48"),
	netip.MustParsePrefix("2001::/32"),
	netip.MustParsePrefix("2002::/16"),
}

// dialPublicOnly runs after DNS resolution, on the address the client is about to connect to.
func dialPublicOnly(_, address string, _ syscall.RawConn) error {
	host, _, err := net.SplitHostPort(address)
	if err != nil {
		return err
	}
	ip, err := netip.ParseAddr(host)
	if err != nil {
		return err
	}
	ip = ip.Unmap()
	if !ip.IsGlobalUnicast() || ip.IsPrivate() {
		return errors.New("destination not allowed")
	}
	for _, p := range nonPublicPrefixes {
		if p.Contains(ip) {
			return errors.New("destination not allowed")
		}
	}
	return nil
}

// No Proxy field: behind a proxy the dialer would only see the proxy's address.
var publicOnlyTransport = &http.Transport{
	DialContext:           (&net.Dialer{Timeout: 30 * time.Second, KeepAlive: 30 * time.Second, Control: dialPublicOnly}).DialContext,
	ForceAttemptHTTP2:     true,
	MaxIdleConns:          100,
	IdleConnTimeout:       90 * time.Second,
	TLSHandshakeTimeout:   10 * time.Second,
	ExpectContinueTimeout: 1 * time.Second,
}

var publicOnlyClient = &http.Client{
	Transport: publicOnlyTransport,
	Timeout:   30 * time.Second,
	CheckRedirect: func(req *http.Request, via []*http.Request) error {
		return http.ErrUseLastResponse
	},
}

type Service struct{}

func (s Service) Name() string {
	return "HTTP"
}

func (s Service) Category() string {
	return "httpclient"
}

func (s Service) Enabled() bool {
	return !env.IsTest()
}

func (s Service) Init() {
	bus.AddHandler(requestHandler)
}

func requestHandler(ctx context.Context, c *cmd.HTTPRequest) error {
	req, err := http.NewRequest(c.Method, c.URL, c.Body)
	if err != nil {
		return err
	}
	req = req.WithContext(ctx)

	for k, v := range c.Headers {
		req.Header.Set(k, v)
	}
	if c.BasicAuth != nil {
		req.SetBasicAuth(c.BasicAuth.User, c.BasicAuth.Password)
	}

	res, err := publicOnlyClient.Do(req)
	if err != nil {
		return err
	}

	defer res.Body.Close()
	respBody, err := io.ReadAll(res.Body)
	if err != nil {
		return err
	}

	c.ResponseBody = respBody
	c.ResponseStatusCode = res.StatusCode
	c.ResponseHeader = res.Header
	return nil
}
