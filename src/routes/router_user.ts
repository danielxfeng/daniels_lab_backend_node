/**
 * @file router_user.ts
 */

import { Router } from "express";
import userController from "../controllers/controller_user";
import { auth, authAdmin } from "../middleware/auth";
import validate from "../middleware/validate";
import { UpdateUserBodySchema } from "../schema/schema_users";

const userRouter = Router();

userRouter.get("/",
  auth,
  userController.getCurrentUserProfile,
);

userRouter.put("/",
  auth,
  validate({ body: UpdateUserBodySchema }),
  userController.updateCurrentUserInfo,
);

userRouter.get("/all",
  authAdmin,
  userController.listAllUsers,
);

export default userRouter;
