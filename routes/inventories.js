var express = require('express');
var router = express.Router();
let inventoryModel = require('../schemas/inventories')

function parseQuantity(quantity) {
    let q = Number(quantity)
    if (!Number.isFinite(q) || q <= 0) {
        return null
    }
    return q
}

router.get('/', async function (req, res) {
    let data = await inventoryModel.find({}).populate('product')
    data = data.filter(function (item) {
        return item.product && !item.product.isDeleted
    })
    res.send(data)
})

router.get('/:id', async function (req, res) {
    try {
        let id = req.params.id;
        let result = await inventoryModel.findOne({
            _id: id
        }).populate('product')
        if (result && result.product && !result.product.isDeleted) {
            res.send(result)
        } else {
            res.status(404).send({
                message: "ID NOT FOUND"
            })
        }
    } catch (error) {
        res.status(404).send({
            message: error.message
        })
    }
})

router.post('/add-stock', async function (req, res) {
    let product = req.body.product
    let quantity = parseQuantity(req.body.quantity)
    if (!product || !quantity) {
        return res.status(400).send({
            message: 'product and quantity (> 0) are required'
        })
    }

    let result = await inventoryModel.findOneAndUpdate({
        product: product
    }, {
        $inc: {
            stock: quantity
        }
    }, {
        new: true
    }).populate('product')

    if (!result) {
        return res.status(404).send({
            message: 'INVENTORY NOT FOUND'
        })
    }
    res.send(result)
})

router.post('/remove-stock', async function (req, res) {
    let product = req.body.product
    let quantity = parseQuantity(req.body.quantity)
    if (!product || !quantity) {
        return res.status(400).send({
            message: 'product and quantity (> 0) are required'
        })
    }

    let result = await inventoryModel.findOneAndUpdate({
        product: product,
        stock: {
            $gte: quantity
        }
    }, {
        $inc: {
            stock: -quantity
        }
    }, {
        new: true
    }).populate('product')

    if (!result) {
        return res.status(400).send({
            message: 'INVENTORY NOT FOUND OR INSUFFICIENT STOCK'
        })
    }
    res.send(result)
})

router.post('/reservation', async function (req, res) {
    let product = req.body.product
    let quantity = parseQuantity(req.body.quantity)
    if (!product || !quantity) {
        return res.status(400).send({
            message: 'product and quantity (> 0) are required'
        })
    }

    let result = await inventoryModel.findOneAndUpdate({
        product: product,
        stock: {
            $gte: quantity
        }
    }, {
        $inc: {
            stock: -quantity,
            reserved: quantity
        }
    }, {
        new: true
    }).populate('product')

    if (!result) {
        return res.status(400).send({
            message: 'INVENTORY NOT FOUND OR INSUFFICIENT STOCK'
        })
    }
    res.send(result)
})

router.post('/sold', async function (req, res) {
    let product = req.body.product
    let quantity = parseQuantity(req.body.quantity)
    if (!product || !quantity) {
        return res.status(400).send({
            message: 'product and quantity (> 0) are required'
        })
    }

    let result = await inventoryModel.findOneAndUpdate({
        product: product,
        reserved: {
            $gte: quantity
        }
    }, {
        $inc: {
            reserved: -quantity,
            soldCount: quantity
        }
    }, {
        new: true
    }).populate('product')

    if (!result) {
        return res.status(400).send({
            message: 'INVENTORY NOT FOUND OR INSUFFICIENT RESERVED'
        })
    }
    res.send(result)
})

module.exports = router;