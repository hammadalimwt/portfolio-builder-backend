const userResponseDTO = (user) => {
  if (!user) return null;
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    avatar: user.avatar,
    bio: user.bio,
    role: user.role,
    status: user.status,
    emailVerified: user.emailVerified,
    lastLogin: user.lastLogin,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt
  };
};

const loginResponseDTO = (user, accessToken, refreshToken) => {
  return {
    user: userResponseDTO(user),
    tokens: {
      accessToken,
      refreshToken
    }
  };
};

module.exports = {
  userResponseDTO,
  loginResponseDTO
};
