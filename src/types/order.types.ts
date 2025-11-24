import { ObjectId } from "mongodb";
import { BaseModel } from "./base.types";


export interface OrderItem {
  productId: ObjectId;
  name: string;
  quantity: number;
  price: number;
}

export interface Order extends BaseModel {
  userId: ObjectId;
  items: OrderItem[];
  totalAmount: number;
  status: "pending" | "paid" | "shipped" | "completed" | "cancelled";
  paymentMethod?: string;
  addressId: ObjectId;  // the chosen delivery address
}
