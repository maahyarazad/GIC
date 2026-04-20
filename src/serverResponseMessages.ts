export const otpMessages = {
  errors: {
    emailRequired: "Email is required",
    mobileRequired: "Mobile number is required",
    originRequired: "Origin is required",
    emailExists: "The entered email is already registered. Please use a different email to register.",
    rateLimit: (seconds: number) => `Please wait ${seconds} seconds before requesting another OTP.`,
    otpExpired: "OTP has expired, please try again",
    otpInvalid: "Invalid OTP code",
    sendOtpFailed: "Failed to send OTP",
    verifyOtpFailed: "OTP verification failed",
  },
  success: {
    otpSentEmail: (email: string) => `OTP successfully sent to ${email}`,
    otpSentMobile: (mobile: string) => `OTP successfully sent to +${mobile}`,
    verificationSuccess: "Verification successful",
  },
};

export const authMessages = {
  errors: {
    missingToken: "Token cookie is missing",
    userNotFound: "User not found",
    invalidToken: "Invalid token",
    missingAuthorizationHeader: "Authorization header is missing",
    invalidPassword: "Invalid password",
    userNotAuthorized:
      "User has not yet been authorized by administration. Please wait for the activation email.",
    loginFailed: "Login failed",
    userExists: "User does not exist. Please check the email and try again.",
    tokenRequired: "Token is required",
    invalidResetToken: "Invalid reset token",
    tokenExpired: "Token has expired",
    tokenAlreadyUsed: "Token has already been used",
    validationError: "Token and new password are required",
    invalidOrUsedToken: "Invalid or already used token",
    internalError: "Internal server error",
    invalidTokenPurpose: "Invalid token purpose",
    
  },
  success: {
    loginSuccess: "Login successful",
    profileFetched: "Profile successfully retrieved",
    tokenValid: "Token is valid",
    resetLinkSent: "Reset link sent",
    passwordResetSuccess: "Password has been successfully reset",
    unsubscribeTokenValid: "Token is valid",
    requirePasswordChange: "For your security, a password change is required. Please update your password to continue."
  },
  info: {
    rateLimit: (seconds: number) =>
      `Please wait ${seconds} seconds before requesting another OTP.`,

  },
};

export const newsletterMessages = {
  errors: {
    emailExists: "The entered email is already subscribed!",
    createError: "Error creating subscriber",
    fetchError: "Internal server error",
    notFound: "Subscriber not found",
    upsertError: "Error updating subscriber",
    unsubscribeError: "Error unsubscribing subscriber",
    subscriberNotFound: "Subscriber not found",
  },
  success: {
    reSubscribed: "Subscriber successfully re-subscribed",
    subscribed: "You are now subscribed to our newsletter! You can unsubscribe at any time.",
    fetchedSubscribers: "Subscribers successfully retrieved",
    fetchedSubscriber: "Subscriber successfully retrieved",
    updatedStatus: "Subscriber status successfully updated",
    unsubscribed: "Subscriber successfully unsubscribed",
  },
};

export const userMessages = {
  errors: {
    invalidFiltersJson: "Invalid filters JSON",
    invalidUserId: "Invalid user ID",
    userNotFound: "User not found",
    emailExists: "The entered email is already registered. Please use a different email to register.",
    fetchCreatedUserFailed: "Failed to fetch created user",
    failedToCreateUser: "Failed to create user",
    failedToFetchUsers: "Failed to fetch users",
    failedToUpdateUser: "Failed to update user",
    noFileUploaded: "No file uploaded",
    photoNotUpdated: "User not found or photo not updated",
    failedToUploadPhoto: "Failed to upload photo",
    internalError: "Internal server error",
  },
  success: {
    usersFetched: "Users successfully retrieved",
    userCreated: "User successfully created",
    userUpdated: "User successfully updated",
    userProfileUpdated: "User profile successfully updated",
    photoUploaded: "Photo successfully uploaded",
  },
};