import { Router } from 'express';
import { createUser, login } from './user.controller.js';

const userRouter = Router();
// @post /api/user/signup

userRouter.post('/signup', createUser);
// @post /api/user/login
userRouter.post('/login', login);
export default userRouter;