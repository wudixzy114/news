import { body } from 'express-validator';

export const registerValidator = [
    body('email').isEmail().withMessage('Please provide a valid email address.'),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters long.'),
    body('name').optional().isString().withMessage('Name must be a string.'),
];

export const loginValidator = [
    body('email').isEmail().withMessage('Please provide a valid email address.'),
    body('password').exists().withMessage('Password is required.'),
];