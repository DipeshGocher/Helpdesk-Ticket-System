const { param } = require('express-validator');

const mongoIdParamValidator = [param('id').isMongoId().withMessage('Invalid ticket id format')];

module.exports = { mongoIdParamValidator };
