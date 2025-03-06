import express, { json } from 'express';

const router = express.Router();
import authMiddleware from '../../middleware/authMiddleware.js';
import { orderFormCreate } from '../../controllers/orderController.js';

// !!! this file is just for parsing the request and sending a response (see the first route for an example). the actual logic should be implemented in controllers. !!! //

// *************** CREATE ORDERS *************** //

router.post('/create/form', authMiddleware, async (req, res) => {
    try {
        // extract parameters
        const { jsonOrderData } = req.body;

        // get response from controller
        const response = await orderFormCreate(jsonOrderData);

        // send response
        res.status(200).json(response);
    } catch (error) {
        console.error("Error creating order form:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// POST /v1/order/create/csv
router.post('/create/csv', authMiddleware, (req, res) => {
    // replace the following with actual logic
    res.json({ message: 'Order CSV uploaded successfully' });
});

// POST /v1/order/create/pdf
router.post('/create/pdf', authMiddleware, (req, res) => {
    // replace the following with actual logic
    res.json({ message: 'Order PDF uploaded successfully' });
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
    const { orderId } = req.params;

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
    const { orderId } = req.params;

    // replace the following with actual logic
    res.json({ message: 'Received order deleted successfully' });
});

// *************** GETTING ORDERS *************** //

// GET /v1/order/list
router.get('/list', authMiddleware, (req, res) => {
    // replace the following with actual logic
    res.json({ message: 'Order list fetched successfully' });
});

// GET /v1/order/{orderId}
router.get('/:orderId', authMiddleware, (req, res) => {
    const { orderId } = req.params;

    // replace the following with actual logic
    res.json({ message: `Order details for ${orderId} fetched successfully` });
});

// GET /v1/order/{orderId}/pdf
router.get('/:orderId/pdf', authMiddleware, (req, res) => {
    const { orderId } = req.params;

    // replace the following with actual logic
    res.json({ message: `Order PDF for ${orderId} downloaded successfully` });
});

// *************** UPDATE ORDERS *************** //

// PUT /v1/order/{orderId}
router.put('/:orderId', authMiddleware, (req, res) => {
    const { orderId } = req.params;

    // replace the following with actual logic
    res.json({ message: 'Order updated successfully' });
});

// DELETE /v1/order/{orderId}
router.delete('/:orderId', authMiddleware, (req, res) => {
    const { orderId } = req.params;

    // replace the following with actual logic
    res.json({ message: 'Order deleted successfully' });
});

export default router;