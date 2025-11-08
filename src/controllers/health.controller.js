import mongoose from 'mongoose';
import User from '../models/User.js';

const mapState = (s) => ({ 0: 'disconnected', 1: 'connected', 2: 'connecting', 3: 'disconnecting' }[s] || String(s));

export const health = async (req, res) => {
  try {
    const state = mapState(mongoose.connection.readyState);
    const users = await User.countDocuments().catch(() => -1);
    res.json({ db: state, users });
  } catch (err) {
    res.status(500).json({ error: err?.message || String(err) });
  }
};

export default { health };

