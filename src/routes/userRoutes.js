const express = require('express');
const userController = require('../controllers/userController');
const { protect } = require('../middlewares/authMiddleware');
const validate = require('../middlewares/validateMiddleware');
const upload = require('../middlewares/uploadMiddleware');
const { updateProfileSchema } = require('../validations/userValidation');
const { changePasswordSchema } = require('../validations/authValidation');

const router = express.Router();

router.use(protect);

router.get('/profile', userController.getProfile);
router.put('/profile', validate(updateProfileSchema), userController.updateProfile);
router.put('/change-password', validate(changePasswordSchema), userController.changePassword);
router.put('/avatar', upload.single('avatar'), userController.uploadAvatar);

module.exports = router;
