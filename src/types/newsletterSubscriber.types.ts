
import { BaseModel } from "./base.types";


export interface NewsletterSubscriber extends BaseModel { 
  email: string;
  active?: boolean; 

}
