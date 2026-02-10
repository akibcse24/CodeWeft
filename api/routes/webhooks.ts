import { Router, Request, Response } from 'express';
import { supabase } from '../server';

const router = Router();

router.post('/', async (req: Request & { userId?: string }, res: Response) => {
  try {
    const { url, events, secret, name, active = true } = req.body;

    if (!url || !events || !Array.isArray(events) || events.length === 0) {
      res.status(400).json({ error: 'Bad request', message: 'URL and at least one event are required' });
      return;
    }

    const { data: webhook, error } = await supabase
      .from('webhooks')
      .insert({
        user_id: req.userId,
        url,
        events,
        secret: secret || null,
        name: name || null,
        active,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    res.status(201).json({ data: webhook });
  } catch (err) {
    console.error('Create webhook error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/', async (req: Request & { userId?: string }, res: Response) => {
  try {
    const { active, limit = '20', offset = '0' } = req.query;

    let query = supabase
      .from('webhooks')
      .select('*')
      .eq('user_id', req.userId)
      .order('created_at', { ascending: false })
      .limit(parseInt(limit as string, 10))
      .range(parseInt(offset as string, 10), parseInt(offset as string, 10) + parseInt(limit as string, 10) - 1);

    if (active !== undefined) {
      query = query.eq('active', active === 'true');
    }

    const { data: webhooks, error } = await query;

    if (error) {
      throw error;
    }

    res.status(200).json({
      data: webhooks || [],
      pagination: {
        limit: parseInt(limit as string, 10),
        offset: parseInt(offset as string, 10)
      }
    });
  } catch (err) {
    console.error('List webhooks error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/:id', async (req: Request & { userId?: string }, res: Response) => {
  try {
    const { id } = req.params;

    const { data: existingWebhook, error: checkError } = await supabase
      .from('webhooks')
      .select('id')
      .eq('id', id)
      .eq('user_id', req.userId)
      .single();

    if (checkError || !existingWebhook) {
      res.status(404).json({ error: 'Not found', message: 'Webhook not found' });
      return;
    }

    const { error } = await supabase
      .from('webhooks')
      .delete()
      .eq('id', id)
      .eq('user_id', req.userId);

    if (error) {
      throw error;
    }

    res.status(204).send();
  } catch (err) {
    console.error('Delete webhook error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/:id/test', async (req: Request & { userId?: string }, res: Response) => {
  try {
    const { id } = req.params;

    const { data: webhook, error: checkError } = await supabase
      .from('webhooks')
      .select('*')
      .eq('id', id)
      .eq('user_id', req.userId)
      .single();

    if (checkError || !webhook) {
      res.status(404).json({ error: 'Not found', message: 'Webhook not found' });
      return;
    }

    if (!webhook.active) {
      res.status(400).json({ error: 'Bad request', message: 'Webhook is inactive' });
      return;
    }

    const testPayload = {
      event: 'webhook.test',
      timestamp: new Date().toISOString(),
      data: {
        message: 'This is a test webhook delivery',
        webhook_id: id,
        webhook_name: webhook.name
      }
    };

    try {
      const response = await fetch(webhook.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Secret': webhook.secret || '',
          'X-Webhook-Event': 'webhook.test',
          'X-Webhook-ID': id,
          'User-Agent': 'CodeWeft-Webhook/1.0'
        },
        body: JSON.stringify(testPayload)
      });

      const deliveryRecord = {
        webhook_id: id,
        event: 'webhook.test',
        payload: testPayload,
        response_status: response.status,
        response_body: await response.text().catch(() => ''),
        success: response.ok,
        delivered_at: new Date().toISOString()
      };

      await supabase.from('webhook_deliveries').insert(deliveryRecord);

      res.status(200).json({
        data: {
          success: response.ok,
          status_code: response.status,
          message: response.ok ? 'Test webhook delivered successfully' : 'Test webhook delivery failed'
        }
      });
    } catch (fetchError) {
      const deliveryRecord = {
        webhook_id: id,
        event: 'webhook.test',
        payload: testPayload,
        response_status: 0,
        response_body: (fetchError as Error).message,
        success: false,
        delivered_at: new Date().toISOString()
      };

      await supabase.from('webhook_deliveries').insert(deliveryRecord);

      res.status(200).json({
        data: {
          success: false,
          status_code: 0,
          message: `Test webhook delivery failed: ${(fetchError as Error).message}`
        }
      });
    }
  } catch (err) {
    console.error('Test webhook error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
