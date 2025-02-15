const serverless = require('serverless-http');
const express = require('express');
const app = express();
const fs = require('fs');
const path = require("path");

app.use(express.json());
app.use(express.static("public"));

validate = validations => {
  return async (req, res, next) => {
    for (const validation of validations) {
      const result = await validation.run(req);
      if (!result.isEmpty()) {
        return res.status(400).json({ message: result.errors[0].msg });
      }
    }
    next();
  };
};

// Register Routes
const routesDir = path.join(__dirname, 'routes');
fs.readdirSync(routesDir).forEach(file => {
    if (file.endsWith('.js')) {
        app.use(`/${file.replace('.js', '')}`,
            require(path.join(routesDir, file)));
    }
});

// for Undefined URL
app.use((req, res, next) => {
    res.status(404).json({
        message: 'Not Found',
    });
});

// Error Handler
app.use((err, req, res, next) => {
    res.status(err.status || 500).json({
        message: err.message || 'Something went wrong on the server.',
    });
});

exports.handler = serverless(app);

