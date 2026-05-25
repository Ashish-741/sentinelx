/**
 * @fileoverview Scan model – stores URL, email, IP, and domain scan results.
 */

import mongoose from 'mongoose';

const scanSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    type: {
      type: String,
      enum: ['url', 'email', 'ip', 'domain'],
      required: [true, 'Scan type is required'],
    },
    target: {
      type: String,
      required: [true, 'Scan target is required'],
      trim: true,
    },
    result: {
      riskScore: {
        type: Number,
        min: 0,
        max: 100,
        default: 0,
      },
      riskLevel: {
        type: String,
        enum: ['safe', 'suspicious', 'dangerous'],
        default: 'safe',
      },
      threats: {
        type: [String],
        default: [],
      },
      details: {
        type: mongoose.Schema.Types.Mixed,
        default: {},
      },
      mlPrediction: {
        type: mongoose.Schema.Types.Mixed,
        default: null,
      },
      aiExplanation: {
        type: String,
        default: '',
      },
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed'],
      default: 'pending',
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret) {
        delete ret.__v;
        return ret;
      },
    },
  }
);

// ── Compound index for efficient user-scoped queries by date ─────────
scanSchema.index({ userId: 1, createdAt: -1 });
scanSchema.index({ userId: 1, type: 1 });

const Scan = mongoose.model('Scan', scanSchema);

export default Scan;
