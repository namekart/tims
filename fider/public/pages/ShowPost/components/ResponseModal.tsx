import React from "react"

import { Modal, Button, DisplayError, Select, Form, Field, SelectOption, TextArea } from "@fider/components"
import { Post, PostStatus } from "@fider/models"

import { actions, Failure } from "@fider/services"
import { PostSearch } from "./PostSearch"
import { i18n } from "@lingui/core"
import { Trans } from "@lingui/react/macro"
import { MentionsInput, Mention } from "react-mentions"
import { orchestratorClient } from "@fider/services/orchestrator/client"
import type { ProjectMapping } from "@fider/services/orchestrator/methods"
import "./ResponseModal.css"


interface ResponseModalProps {
  post: Post
  showModal: boolean
  onCloseModal: () => void
}

interface ResponseModalState {
  status: string
  text: string
  originalNumber: number
  error?: Failure
  projects: ProjectMapping[]
}

export class ResponseModal extends React.Component<ResponseModalProps, ResponseModalState> {
  constructor(props: ResponseModalProps) {
    super(props)

    this.state = {
      status: this.props.post.status,
      originalNumber: 0,
      text: this.props.post.response ? this.props.post.response.text : "",
      projects: [],
    }
  }



  public async componentDidMount() {
    try {
      const projects = await orchestratorClient.listProjects()
      this.setState({ projects })
    } catch (err) {
      // Silently ignore orchestrator errors; mentions are optional UX
    }
  }

  private submit = async () => {
    const result = await actions.respond(this.props.post.number, this.state)
    if (result.ok) {
      location.reload()
    } else {
      this.setState({
        error: result.error,
      })
    }
  }

  private setStatus = (opt?: SelectOption) => {
    if (opt) {
      this.setState({ status: opt.value })
    }
  }

  private setOriginalNumber = (originalNumber: number) => {
    this.setState({ originalNumber })
  }

  private setText = (text: string) => {
    this.setState({ text })
  }


  public render() {
    const options = PostStatus.All.map((s) => {
      const id = `enum.poststatus.${s.value.toString()}`
      return {
        value: s.value.toString(),
        label: i18n._(id, { message: s.title }),
      }
    })

    const modal = (
      <Modal.Window isOpen={this.props.showModal} onClose={this.props.onCloseModal} center={false} size="large">
        <Modal.Content>
          <Form error={this.state.error} className="c-response-form">
            <Select field="status" label="Status" defaultValue={this.state.status} options={options} onChange={this.setStatus} />
            {this.state.status === PostStatus.Duplicate.value ? (
              <>
                <Field>
                  <PostSearch exclude={[this.props.post.number]} onChanged={this.setOriginalNumber} />
                </Field>
                <DisplayError fields={["originalNumber"]} error={this.state.error} />
                <span className="text-muted">
                  <Trans id="showpost.responseform.message.mergedvotes">Votes from this post will be merged into original post.</Trans>
                </span>
              </>
            ) : this.state.status === PostStatus.Planned.value ? (
              <div>
                <MentionsInput
                  value={this.state.text}
                  onChange={(_, newValue) => this.setText(newValue)}
                  placeholder={i18n._({
                    id: "showpost.responseform.text.placeholder",
                    message: "What's going on with this post? Let your users know what are your plans...",
                  })}
                  className="mentions"
                >
                  <Mention
                    trigger="#"
                    markup="#__id__"
                    appendSpaceOnAdd
                    displayTransform={(id, display) => `#${display}`}
                    data={this.state.projects.map((p) => ({ id: p.productTag, display: p.projectName }))}
                  />
                </MentionsInput>
                <span className="text-muted" style={{ display: "block", marginTop: 6 }}>
                  <Trans id="showpost.responseform.mentions.help">Type # to mention a project</Trans>
                </span>
              </div>
            ) : (
              <TextArea
                field="text"
                onChange={this.setText}
                value={this.state.text}
                minRows={5}
                placeholder={i18n._({
                  id: "showpost.responseform.text.placeholder",
                  message: "What's going on with this post? Let your users know what are your plans...",
                })}
              />
            )}
          </Form>
        </Modal.Content>

        <Modal.Footer>
          <Button variant="primary" onClick={this.submit}>
            <Trans id="action.submit">Submit</Trans>
          </Button>
          <Button variant="tertiary" onClick={this.props.onCloseModal}>
            <Trans id="action.cancel">Cancel</Trans>
          </Button>
        </Modal.Footer>
      </Modal.Window>
    )

    return modal
  }
}
