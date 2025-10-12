import { Request, Response } from 'express';
import PlaneClient from '../services/PlaneClient';
import FiderClient from '../services/FiderClient';
import DatabaseService from '../services/DatabaseService';
import config from '../config';
import { FiderWebhookPayload, PlaneWebhookPayload } from '../types';
import crypto from 'crypto';

/**
 * Handle incoming Fider webhooks
 */
export async function handleFiderWebhook(req: Request , res: Response): Promise<void> {
  console.log('🔵 Fider webhook received');
  console.log('   ↳ Content-Type:', req.header('Content-Type'));
  console.log('   ↳ User-Agent:', req.header('User-Agent'));
  console.log('   ↳ Raw body length:', JSON.stringify(req.body).length, 'chars');
  console.log('   ↳ Body:', JSON.stringify(req.body, null, 2));
  console.log('   ↳ Body type:', typeof req.body);
  console.log('   ↳ Body keys:', Object.keys(req.body || {}).join(', '));

  const log = await DatabaseService.logWebhook({
    source: 'fider',
    eventType: req.body.type || 'unknown',
    payload: req.body,
    status: 'processing',
  });

  try {
    const payload: FiderWebhookPayload = req.body;

    console.log('📨 Parsed Fider payload:');
    console.log('   ↳ type:', payload.type);
    console.log('   ↳ post_number:', payload.post_number);
    console.log('   ↳ post_title:', payload.post_title);
    console.log('   ↳ post_description:', payload.post_description?.substring(0, 100));
    console.log('   ↳ post_url:', payload.post_url);
    console.log('   ↳ post_status:', payload.post_status);
    console.log('   ↳ author_name:', payload.author_name);
    console.log('   ↳ Full Payload:', JSON.stringify(payload, null, 2));

    // Check for empty or malformed payloads
    if (!payload.type) {
      console.log('⚠️  WARNING: Empty or malformed Fider webhook payload');
      console.log('   ↳ This usually means Fider webhook is not configured properly');
      console.log('   ↳ Check Fider webhook settings: Content-Type should be application/json');
      console.log('   ↳ Request body should contain proper JSON with all required fields');
    }

    // Handle different Fider event types
    switch (payload.type) {
      case 'new_post':
        await handleNewPost(payload);
        break;

      case 'new_comment':
        await handleNewComment(payload);
        break;

      case 'post_status_changed':
        await handlePostStatusChanged(payload);
        break;

      default:
        console.log(`⚠️  Unhandled Fider event type: ${payload.type}`);
    }

    await DatabaseService.updateWebhookStatus(log.id, 'success');
    res.status(200).json({ success: true, message: 'Webhook processed' });
  } catch (error: any) {
    console.error('❌ Error processing Fider webhook:', error.message);
    await DatabaseService.updateWebhookStatus(log.id, 'failed', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
}

/**
 * Handle incoming Plane webhooks
 */
export async function handlePlaneWebhook(req: Request , res: Response): Promise<void> {
  const log = await DatabaseService.logWebhook({
    source: 'plane',
    eventType: req.body.event || 'unknown',
    payload: req.body,
    status: 'processing',
  });

  try {
    // Verify signature if WEBHOOK_SECRET configured
    const signature = req.header('X-Plane-Signature');
    const eventHeader = req.header('X-Plane-Event');
    const deliveryHeader = req.header('X-Plane-Delivery');
    console.log('🛰️  Plane webhook received');
    console.log(`   ↳ X-Plane-Event: ${eventHeader}`);
    console.log(`   ↳ X-Plane-Delivery: ${deliveryHeader}`);
    console.log(`   ↳ Has Signature: ${signature ? 'yes' : 'no'}`);
    // Temporarily disable signature verification to see payload
    // if (config.webhookSecret && signature) {
    //   const body = Buffer.from(JSON.stringify(req.body));
    //   const expected = crypto
    //     .createHmac('sha256', config.webhookSecret)
    //     .update(body)
    //     .digest('hex');
    //   const match = crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
    //   console.log(`   ↳ Signature match: ${match ? 'true' : 'false'}`);
    //   if (!match) {
    //     throw new Error('Invalid Plane webhook signature');
    //   }
    // }

    const payload: PlaneWebhookPayload = req.body;

    console.log('📨 Received Plane webhook:', payload.event);
    console.log('🔍 Full Plane webhook payload:');
    console.log(JSON.stringify(payload, null, 2));

    // Handle different Plane event types
    switch (payload.event) {
      case 'issue.created':
        await handleIssueCreated(payload);
        break;

      case 'issue':
        if (payload.action === 'created') {
          await handleIssueCreated(payload);
        } else if (payload.action === 'updated') {
          await handleIssueUpdated(payload);
        } else if (payload.action === 'deleted') {
          await handleIssueDeleted(payload);
        } else {
          console.log(`⚠️  Unhandled issue action: ${payload.action}`);
        }
        break;

      case 'issue.updated':
        await handleIssueUpdated(payload);
        break;

      case 'issue.deleted':
        await handleIssueDeleted(payload);
        break;

      case 'project':
        await handleProjectEvent(payload);
        break;

      default:
        console.log(`⚠️  Unhandled Plane event type: ${payload.event}`);
    }

    await DatabaseService.updateWebhookStatus(log.id, 'success');
    res.status(200).json({ success: true, message: 'Webhook processed' });
  } catch (error: any) {
    console.error('❌ Error processing Plane webhook:', error.message);
    await DatabaseService.updateWebhookStatus(log.id, 'failed', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
}

// === Fider Event Handlers ===

async function handleNewPost(payload: FiderWebhookPayload): Promise<void> {
  console.log(`📝 New Fider post created (no action needed)`);
  console.log(`   ↳ Post #${payload.post_number}: "${payload.post_title}"`);
  console.log(`   ↳ Status: ${payload.post_status || 'open'}`);
  console.log('ℹ️  Will create Plane issue only when status changes to "planned"');
}

async function handleNewComment(payload: FiderWebhookPayload): Promise<void> {
  console.log(`💬 New comment on Fider post #${payload.post_number}`);

  // Get the mapping
  const mapping = await DatabaseService.getMappingByFiderPost(payload.post_number);
  if (!mapping) {
    console.log(`⚠️  No mapping found for Fider post #${payload.post_number}`);
    return;
  }

  // TODO: Sync comment to Plane issue
  console.log(`ℹ️  Would sync comment to Plane issue ${mapping.planeIssueId}`);
}

async function handlePostStatusChanged(payload: FiderWebhookPayload): Promise<void> {
  console.log(`📝 Post status changed for Fider post #${payload.post_number}`);
  console.log(`   ↳ New status: ${payload.post_status}`);
  console.log(`   ↳ Post title: "${payload.post_title}"`);
  console.log(`   ↳ Post description: "${payload.post_description?.substring(0, 100)}..."`);

  // Only create Plane issue if status is "planned"
  if (payload.post_status !== 'planned') {
    console.log(`ℹ️  Status is "${payload.post_status}" (not "planned"), skipping Plane issue creation`);
    return;
  }

  console.log('🎯 Status is "planned" - proceeding with Plane issue creation');

  // Check if this post is already mapped
  const existingMapping = await DatabaseService.getMappingByFiderPost(payload.post_number);
  if (existingMapping) {
    console.log(`⚠️  Fider post #${payload.post_number} is already mapped to a Plane issue`);
    return;
  }

  // Extract product tags from post title and description
  console.log('🔍 Determining project from tags...');
  const projectId = await determineProjectFromTags(payload);
  if (!projectId) {
    console.log('❌ No matching project mapping found for hashtags; skipping Plane issue creation');
    return;
  }
  console.log(`   ↳ Selected project ID: ${projectId}`);

  // Prepare a clean title without any hashtags (e.g. "#test1")
  const cleanTitle = stripHashtags(payload.post_title).trim();
  console.log(`   ↳ Original title: "${payload.post_title}"`);
  console.log(`   ↳ Clean title: "${cleanTitle}"`);

  const fiderUrl = `https://fider.namekart.com/posts/${payload.post_number}`;
  const description = `${payload.post_description}\n\n---\n\n**Source:** [Fider Post #${payload.post_number}](${fiderUrl})\n**Author:** ${payload.author_name}`;
  const issue = {
    name: `${cleanTitle}`,
    description: description,
    description_html: `<div><p>${payload.post_description}</p><hr/><p><strong>Source:</strong> <a href="${fiderUrl}" rel="noopener noreferrer">Fider Post #${payload.post_number}</a></p><p><strong>Author:</strong> ${payload.author_name}</p></div>`,
    priority: determinePriority(payload.post_votes || 0),
  };

  console.log('📤 Calling Plane API to create issue...');
  console.log('   ↳ Issue name:', issue.name);
  console.log('   ↳ Project ID:', projectId);

  try {
    // Create issue in Plane
    const createdIssue = await PlaneClient.createIssue(issue, projectId);
    console.log('✅ Plane issue created:', createdIssue.id);

    // Build Plane issue URL using project issues list
    const planeIssueUrl = `https://plane.namekart.com/${config.plane.workspaceSlug}/projects/${projectId}/issues/`;

    // Store the mapping in database
    await DatabaseService.createMapping({
      fiderPostNumber: payload.post_number,
      fiderPostUrl: `https://fider.namekart.com/posts/${payload.post_number}`,
      fiderPostTitle: payload.post_title,
      planeIssueId: createdIssue.id,
      planeIssueUrl: planeIssueUrl,
      planeProjectId: projectId,
    });

    console.log(`✅ Stored mapping: Fider #${payload.post_number} ↔ Plane ${createdIssue.id}`);

    // Add Fider comment immediately with Plane URL
    try {
      await FiderClient.addComment(
        payload.post_number,
        `🚀 **Tracked in Plane**\n\n[📋 View in Project Dashboard](${planeIssueUrl})\n\n*This feedback has been created as a work item in our project management system.*`
      );
      console.log(`✅ Added Fider comment with Plane URL: ${planeIssueUrl}`);
    } catch (commentError: any) {
      console.error(`❌ Failed to add Fider comment: ${commentError.message}`);
      // Don't throw - the main issue creation was successful
    }

    console.log(`🎉 Successfully created Plane issue for Fider post #${payload.post_number} with status "planned"`);

  } catch (error: any) {
    console.error('❌ Failed to create Plane issue:', error.response?.data || error.message);
    console.error(`   ↳ Fider post #${payload.post_number} status change to "planned" failed`);
    throw error;
  }
}

// === Plane Event Handlers ===

async function handleIssueCreated(payload: PlaneWebhookPayload): Promise<void> {
  console.log(`✨ New Plane issue created: ${payload.data?.id || payload.issue?.id}`);

  // Use data field from webhook payload (more complete)
  const issueData = payload.data || payload.issue;
  if (!issueData) {
    console.log('⚠️  No issue data in payload');
    return;
  }

  console.log(`🔍 Issue sequence_id: ${issueData.sequence_id}`);
  console.log(`🔍 Issue project: ${issueData.project}`);

  // Build correct Plane URL using webhook data
  const correctPlaneUrl = `https://plane.namekart.com/${config.plane.workspaceSlug}/projects/${issueData.project}/issues/`;
  console.log(`🔗 Correct Plane URL: ${correctPlaneUrl}`);

  // Check if this issue was created by Fider webhook (already has mapping)
  const existingMapping = await DatabaseService.getMappingByPlaneIssue(issueData.id);
  if (existingMapping) {
    console.log(`ℹ️  Plane issue ${issueData.id} is already mapped (created from Fider) - comment already added`);
    return;
  }

  // This is a manually created Plane issue - check if it references a Fider post
  const fiderMatch = issueData.name?.match(/\[Fider #(\d+)\]/);
  if (!fiderMatch) {
    console.log('ℹ️  Plane issue does not reference a Fider post - skipping');
    return;
  }

  const fiderPostNumber = parseInt(fiderMatch[1], 10);
  console.log(`🔍 Found Fider reference: #${fiderPostNumber}`);

  // Get the Fider post to build URL
  try {
    const fiderPost = await FiderClient.getPost(fiderPostNumber);
    const fiderUrl = `https://fider.namekart.com/posts/${fiderPostNumber}/${fiderPost.slug}`;

    // Store mapping
    await DatabaseService.createMapping({
      fiderPostNumber,
      fiderPostUrl: fiderUrl,
      fiderPostTitle: fiderPost.title,
      planeIssueId: issueData.id,
      planeIssueUrl: correctPlaneUrl,
      planeProjectId: issueData.project,
    });

    console.log(`✅ Linked Plane issue to Fider post #${fiderPostNumber}`);
  } catch (error: any) {
    console.error(`❌ Failed to link Plane issue to Fider: ${error.message}`);
  }
}

async function handleIssueUpdated(payload: PlaneWebhookPayload): Promise<void> {
  console.log(`📝 Plane issue updated: ${payload.issue?.id}`);
  // Sync status changes back to Fider if needed
}

async function handleIssueDeleted(payload: PlaneWebhookPayload): Promise<void> {
  console.log(`🗑️  Plane issue deleted: ${payload.issue?.id}`);
  // Handle cleanup if needed
}

// === Helper Functions ===

/**
 * Handle Plane project events (create/update/delete)
 * On create: auto-register product tag mapping using project slug
 */
async function handleProjectEvent(payload: PlaneWebhookPayload): Promise<void> {
  const rawAction = payload.action || 'update';
  const action = String(rawAction).toLowerCase(); // e.g. create/created/update/updated/delete/deleted
  const data = payload.data || {};
  const projectId: string | undefined = data.id;
  const projectName: string | undefined = data.name;
  let slug: string | undefined = data?.workspace_detail?.slug || data.slug;

  console.log(`📁 Plane project event: action=${action} id=${projectId} name=${projectName} slug=${slug}`);

  // Accept both "create" and "created"
  const isCreate = action === 'create' || action === 'created';

  // Fallbacks if slug is missing
  if (!slug && data.identifier) {
    slug = String(data.identifier).toLowerCase();
  }
  if (!slug && projectName) {
    slug = projectName
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9\s_-]/g, '')
      .replace(/\s+/g, '-');
  }

  if (isCreate) {
    if (!projectId || !projectName) {
      console.log('⚠️  Missing required fields for project create; skipping DB write');
      return;
    }
    const productTag = (slug || projectName).toLowerCase();
    try {
      const row = await DatabaseService.createProjectMapping({
        productTag,
        planeProjectId: projectId,
        projectName,
      });
      console.log(`✅ Registered product tag "#${row.productTag}" → project ${row.projectName} (${row.planeProjectId})`);
    } catch (err: any) {
      console.error(`❌ Failed to write project mapping: ${err.message}`);
    }
  }

  // Handle update/updated
  if (action === 'update' || action === 'updated') {
    if (!projectId) {
      console.log('⚠️  Missing project id for update event');
      return;
    }
    // Compute possible new productTag if slug/name changed
    let nextTag = slug;
    if (!nextTag && projectName) {
      nextTag = projectName
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9\s_-]/g, '')
        .replace(/\s+/g, '-');
    }
    try {
      const result = await DatabaseService.updateProjectMappingForProject({
        planeProjectId: projectId,
        projectName: projectName,
        productTag: nextTag,
      });
      console.log(`✅ Project mapping updated for ${projectId}. Rows affected: ${result.count}`);
    } catch (err: any) {
      console.error(`❌ Failed to update project mapping: ${err.message}`);
    }
    return;
  }

  // Handle delete/deleted
  if (action === 'delete' || action === 'deleted') {
    if (!projectId) {
      console.log('⚠️  Missing project id for delete event');
      return;
    }
    try {
      const result = await DatabaseService.deleteProjectMappingForProject(projectId);
      console.log(`🗑️  Deleted project mappings for ${projectId}. Rows affected: ${result.count}`);
    } catch (err: any) {
      console.error(`❌ Failed to delete project mapping: ${err.message}`);
    }
    return;
  }
}

/**
 * Determine which Plane project to use based on product tags in Fider post
 * Tags like #product_name or #project_name in post_response_text
 */
async function determineProjectFromTags(payload: FiderWebhookPayload): Promise<string | null> {
  // Look for hashtags in post_response_text (where status change comments are)
  const responseText = payload.post_response_text || '';
  const combinedText = `${payload.post_title} ${payload.post_description} ${responseText}`.toLowerCase();

  // Extract hashtags
  const hashtagRegex = /#([a-z0-9_-]+)/gi;
  const hashtags = combinedText.match(hashtagRegex) || [];

  console.log(`🔍 Found hashtags: ${hashtags.join(', ')}`);
  console.log(`   ↳ From post_response_text: "${responseText}"`);

  // Check each hashtag against project mappings
  for (const hashtag of hashtags) {
    const tag = hashtag.slice(1); // Remove the # symbol
    const projectMapping = await DatabaseService.getProjectByTag(tag);

    if (projectMapping) {
      console.log(`✅ Matched tag "${tag}" to project: ${projectMapping.projectName}`);
      return projectMapping.planeProjectId;
    }
  }

  // No match
  console.log(`ℹ️  No matching product tag found for hashtags: ${hashtags.join(', ')}`);
  return null;
}

async function buildIssueDescription(payload: FiderWebhookPayload): Promise<string> {
  return `https://fider.namekart.com/posts/${payload.post_number}`;
}

function determinePriority(votes: number): 'low' | 'medium' | 'high' | 'urgent' {
  if (votes >= 10) return 'high';
  if (votes >= 5) return 'medium';
  return 'low';
}

function stripHashtags(text: string): string {
  // Remove tokens that start with '#' followed by allowed tag chars
  // Keep spacing sane afterwards
  return text
    .replace(/(^|\s)#[a-z0-9_-]+(?!\S)/gi, ' ') // remove hashtag tokens
    .replace(/\s{2,}/g, ' '); // collapse excess spaces
}

async function resolveFiderPostUrl(payload: FiderWebhookPayload): Promise<string> {
  try {
    // If payload already has a URL, prefer it
    if (payload.post_url) return payload.post_url;
    // Otherwise, fetch from Fider API using post_number
    const number = payload.post_number;
    if (!number) return '';
    const FiderClientModule = await import('../services/FiderClient');
    const client = FiderClientModule.default;
    const post = await client.getPost(number);
    return `https://fider.namekart.com/posts/${number}/${post.slug}`;
  } catch {
    return '';
  }
}
