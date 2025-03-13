const validate = {
    email: (value: string) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!value) return 'Email is required';
        if (!emailRegex.test(value)) return 'Please enter a valid email';
        return '';
    },

    password: (value: string) => {
        if (!value) return 'Password is required';
        if (value.length < 8) return 'Password must be at least 8 characters';
        return '';
    },

    notEmptyTextOnly: (value: string) => {
        if (!value) return 'Field is required';
        if (value === '' || value === ' ') return 'Field cannot be blank';
        if (!/^[A-Za-z\- ]+$/.test(value)) return 'Field can contain only letters, hyphens, and spaces';
        return '';
    },
};

export default validate;