const User = require('../models/User');


const getUserProfile = async (req, res) => {
    const userId = req.session.user.id;

    try {
        const result = await User.findByPk(userId);
        if (!result) {
            return res.status(404).json({ message: 'User not found' });
        }
        return res.status(200).json(result);
    } catch (error) {
        return res.status(500).json({ message: 'Server error', error: error.message });
    }
};

module.exports = { getUserProfile };


