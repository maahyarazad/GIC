import { Schema, model, models, Types } from "mongoose";

export interface OrderItemDocument {
  productId: Types.ObjectId;
  name: string;
  quantity: number;
  price: number;
}

export interface OrderDocument {
  userId: Types.ObjectId;
  items: OrderItemDocument[];
  totalAmount: number;
  status: "pending" | "paid" | "shipped" | "completed" | "cancelled";
  paymentMethod?: string;
  addressId: Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
}

const OrderItemSchema = new Schema<OrderItemDocument>(
  {
    productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    name: { type: String, required: true, trim: true },
    quantity: { type: Number, required: true, min: 1 },
    price: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const OrderSchema = new Schema<OrderDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    items: {
      type: [OrderItemSchema],
      required: true,
      validate: {
        validator: (items: OrderItemDocument[]) => Array.isArray(items) && items.length > 0,
        message: "Order must contain at least one item.",
      },
    },
    totalAmount: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: ["pending", "paid", "shipped", "completed", "cancelled"],
      default: "pending",
      index: true,
    },
    paymentMethod: { type: String, default: undefined },
    addressId: { type: Schema.Types.ObjectId, ref: "Address", required: true },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

export const OrderModel = models.Order || model<OrderDocument>("Order", OrderSchema);
