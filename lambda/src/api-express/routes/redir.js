const express = require('express');
const router = express.Router();
const { body } = require('express-validator');

router.get("/307", (req, res, next) => {
    if (req.query.r) {
        return res.redirect(req.query.r);
    } else {
        return res.status(400).send('Missing r parameter');
    }
});

module.exports = router;
