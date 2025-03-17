import express from 'express';
import authMiddleware from '../../middleware/authMiddleware.js';
import {
  orderFormCreate,
  orderFormUpdate,
  isOrderIdValid,
  getOrderFromOrderId,
  orderDelete,
  orderList,
  orderFormCreateGuest
} from '../../controllers/orderController.js';
import orderSchema from '../../schemas/orderSchema.js';
import multer from 'multer';
import { validateCSV } from './helpers.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// !!! this file is just for parsing the request and sending a response (see the first route for an example). the actual logic should be implemented in controllers. !!! //

// *************** CREATE ORDERS *************** //

// POST /v1/order/create/form AUTHENTICATED
router.post('/create/form', authMiddleware, async (req, res) => {
  try {
    // validate request body
    const { error } = orderSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: `Validation Error: ${error.message}` });
    }

    // get response from controller
    const response = await orderFormCreate(req.user.email, req.body);

    // send response
    res.status(200).json(response);
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// POST /v1/order/create/form-guest UNAUTHENTICATED
router.post('/create/form-guest', async (req, res) => {
  try {
    // validate request body
    const { error } = orderSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: `Validation Error: ${error.message}` });
    }

    // get response from controller
    const response = await orderFormCreateGuest(req.body);

    // send response
    res.status(200).json(response);
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' + error });
  }
});

// POST /v1/order/create/bulk
router.post('/create/bulk', authMiddleware, async (req, res) => {
  try {
    const { orders } = req.body;
    if (!Array.isArray(orders)) {
      return res.status(400).json({ error: 'Invalid orderList given' });
    } else {
      const orderIds = [];
      for (const order of orders) {
        const { error } = orderSchema.validate(order);
        if (error) {
          return res.status(400).json({ error: `Validation Error: ${error.message}` });
        } else {
          const response = await orderFormCreate(req.user.email, order);
          orderIds.push(response.orderId);
        }
      }
      return res.status(200).json({ orderIds });
    }
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// POST /v1/order/create/csv
router.post('/create/csv', upload.single('file'), authMiddleware, async (req, res) => {
  try {
    const jsonData = JSON.parse(req.body.json);
    const csvContent = req.file.buffer.toString('utf-8');

    const validation = validateCSV(csvContent);
    if (!validation.valid) {
      return res.status(400).json({ error: validation.error });
    }

    const response = await orderFormCreate(req.user.email, jsonData, csvContent);
    res.status(200).json(response);
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// **************** SEND ORDERS **************** //

// POST /v1/order/send
router.post('/send', authMiddleware, (req, res) => {
  // replace the following with actual logic
  res.json({ message: 'Order sent successfully' });
});

// GET /v1/order/sent/list
router.get('/sent/list', authMiddleware, (req, res) => {
  // replace the following with actual logic
  res.json({ message: 'Sent orders list fetched successfully' });
});

// DELETE /v1/order/sent/{orderId}
router.delete('/sent/:orderId', authMiddleware, (req, res) => {
  // const { orderId } = req.params;

  // replace the following with actual logic
  res.json({ message: 'Sent order deleted successfully' });
});

// ************** RECEIVED ORDERS ************** //

// GET /v1/order/received/list
router.get('/received/list', authMiddleware, (req, res) => {
  // replace the following with actual logic
  res.json({ message: 'Received orders list fetched successfully' });
});

// DELETE /v1/order/received/{orderId}
router.delete('/received/:orderId', authMiddleware, (req, res) => {
  // const { orderId } = req.params;

  // replace the following with actual logic
  res.json({ message: 'Received order deleted successfully' });
});

// *************** GETTING ORDERS *************** //

// GET /v1/order/list
router.get('/list', authMiddleware, async (req, res) => {
  try {
    const response = await orderList(req.user.email);
    res.status(200).json(response);
  } catch (error) {
    if (error.status) {
      res.status(error.status).json({ error: error.message });
    } else {
      // unknown error
      res.status(500).json({ error: 'Unexpected server error' });
    }
  }
});

// GET /v1/order/{orderId}
router.get('/:orderId', authMiddleware, async (req, res) => {
  const { orderId } = req.params;
  try {
    if (!orderId || !(await isOrderIdValid(orderId))) {
      return res.status(400).json({ error: 'Invalid orderId given' });
    } else {
      const xmlResponse = await getOrderFromOrderId(orderId);
      res.setHeader('Content-Type', 'application/xml');
      return res.status(200).send(xmlResponse);
    }
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// GET /v1/order/{orderId}/pdf
router.get('/:orderId/pdf', authMiddleware, (req, res) => {
  const { orderId } = req.params;

  // replace the following with actual logic
  res.json({ message: `Order PDF for ${orderId} downloaded successfully` });
});

// *************** UPDATE ORDERS *************** //

// PUT /v1/order/{orderId}
router.put('/:orderId', authMiddleware, async (req, res) => {
  const orderId = parseInt(req.params.orderId);

  try {
    // validate request body and order id
    const { error } = orderSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: `Validation Error: ${error.message}` });
    }
    const isValid = await isOrderIdValid(orderId);
    if (!isValid) {
      return res.status(400).json({ error: 'Invalid orderId given' });
    }

    // get response from controller
    const response = await orderFormUpdate(req.user.email, orderId, req.body);

    // send response
    res.status(200).json(response);
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// DELETE /v1/order/{orderId}
router.delete('/:orderId', authMiddleware, async (req, res) => {
  const { orderId } = req.params;

  try {
    const isValid = await isOrderIdValid(orderId);
    if (!isValid) {
      return res.status(400).json({ error: 'Invalid orderId given' });
    }

    const response = await orderDelete(orderId);
    res.status(200).json(response);
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

export default router;
