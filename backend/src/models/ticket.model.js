const mongoose = require('mongoose');

const CATEGORY_ENUM = ['Bug', 'Feature', 'Billing', 'Other'];
const PRIORITY_ENUM = ['Low', 'Medium', 'High', 'Critical'];
const STATUS_ENUM = ['Open', 'In Progress', 'Resolved', 'Closed', 'Queued'];
const HISTORY_TYPE_ENUM = ['Status Change', 'Priority Change', 'Auto Assignment', 'Queue Assignment'];
const COMMENT_AUTHOR_ROLE_ENUM = ['agent', 'customer'];

const commentSchema = new mongoose.Schema(
  {
    text: {
      type: String,
      required: [true, 'Comment text is required'],
      trim: true,
      minlength: [3, 'Comment must be at least 3 characters'],
    },
    // Optional (not required) so pre-auth legacy comments can still be displayed
    // with a generic fallback rather than failing validation retroactively.
    authorName: { type: String, default: null },
    authorRole: { type: String, enum: COMMENT_AUTHOR_ROLE_ENUM, default: null },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const historySchema = new mongoose.Schema(
  {
    // Note: must use the object form ({ type: String, ... }) here - Mongoose reserves
    // the shorthand `type: String` for declaring a field's data type, not a field name.
    type: { type: String, enum: HISTORY_TYPE_ENUM, required: true },
    from: { type: String, default: null },
    to: { type: String, default: null },
    note: { type: String, default: '' },
    timestamp: { type: Date, default: Date.now },
  },
  { _id: false }
);

const ticketSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      minlength: [5, 'Title must be at least 5 characters'],
      maxlength: [100, 'Title must be at most 100 characters'],
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      minlength: [20, 'Description must be at least 20 characters'],
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: { values: CATEGORY_ENUM, message: 'Invalid category: {VALUE}' },
    },
    priority: {
      type: String,
      required: [true, 'Priority is required'],
      enum: { values: PRIORITY_ENUM, message: 'Invalid priority: {VALUE}' },
    },
    status: {
      type: String,
      enum: { values: STATUS_ENUM, message: 'Invalid status: {VALUE}' },
      default: 'Open',
    },
    version: { type: Number, default: 0 },
    assignedAgent: { type: mongoose.Schema.Types.ObjectId, ref: 'Agent', default: null },
    // Not required at the schema level: tickets created before auth was added have
    // no owner and remain visible to agents only (customers never see createdBy: null).
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', default: null },
    slaDeadline: { type: Date, default: null },
    // Tracks whether the SLA-breach auto-escalation has already fired once for this ticket.
    slaEscalated: { type: Boolean, default: false },
    // Freezes the SLA verdict at resolution time so a ticket resolved within its window
    // doesn't later read as "breached" purely because wall-clock time kept advancing.
    resolvedAt: { type: Date, default: null },
    comments: { type: [commentSchema], default: [] },
    history: { type: [historySchema], default: [] },
  },
  { timestamps: true, versionKey: false }
);

ticketSchema.index({ status: 1 });
ticketSchema.index({ priority: 1 });
ticketSchema.index({ assignedAgent: 1, status: 1 });
ticketSchema.index({ status: 1, createdAt: 1 });
ticketSchema.index({ createdBy: 1, createdAt: 1 });

module.exports = mongoose.model('Ticket', ticketSchema);
module.exports.CATEGORY_ENUM = CATEGORY_ENUM;
module.exports.PRIORITY_ENUM = PRIORITY_ENUM;
module.exports.STATUS_ENUM = STATUS_ENUM;
module.exports.HISTORY_TYPE_ENUM = HISTORY_TYPE_ENUM;
module.exports.COMMENT_AUTHOR_ROLE_ENUM = COMMENT_AUTHOR_ROLE_ENUM;
