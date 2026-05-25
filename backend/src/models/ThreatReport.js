/**
 * @fileoverview ThreatReport model – cached threat intelligence data.
 * Documents expire after 24 hours via a TTL index so stale data is purged automatically.
 */

import mongoose from 'mongoose';

const threatReportSchema = new mongoose.Schema(
  {
    target: {
      type: String,
      required: [true, 'Target is required'],
      trim: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['ip', 'domain'],
      required: [true, 'Report type is required'],
    },
    virusTotalData: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    abuseIPDBData: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    whoisData: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    geoData: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    overallScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    toJSON: {
      transform(_doc, ret) {
        delete ret.__v;
        return ret;
      },
    },
  }
);

// ── TTL index – auto-delete after 24 hours ───────────────────────────
threatReportSchema.index({ createdAt: 1 }, { expireAfterSeconds: 86400 });

const ThreatReport = mongoose.model('ThreatReport', threatReportSchema);

export default ThreatReport;
