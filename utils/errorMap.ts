export const getErrorMessage = (errorCode: string): string => {
    const errorMap: Record<string, string> = {
        'auth/email-already-in-use': 'This email is already associated with an account',
        'auth/invalid-email': 'Please enter a valid email address',
        'auth/weak-password': 'Password should be at least 6 characters',
        'auth/user-not-found': 'No account found with this email',
        'auth/wrong-password': 'Incorrect password',
        'auth/too-many-requests': 'Too many unsuccessful attempts. Please try again later',
        'auth/network-request-failed': 'Network error. Please check your connection',
        'default': 'An error occurred. Please try again'
    };

    return errorMap[errorCode] || errorMap['default'];
};