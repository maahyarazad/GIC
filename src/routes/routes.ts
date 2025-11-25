/* tslint:disable */
/* eslint-disable */
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import type { TsoaRoute } from '@tsoa/runtime';
import {  fetchMiddlewares, ExpressTemplateService } from '@tsoa/runtime';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { UserController } from './../controllers/user.controller';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { ProductConroller } from './../controllers/product.controller';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { OtpController } from './../controllers/otp.controller';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { ClientController } from './../controllers/client.controller';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { AuthController } from './../controllers/auth.controller';
import type { Request as ExRequest, Response as ExResponse, RequestHandler, Router } from 'express';



// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

const models: TsoaRoute.Models = {
    "UserSortKey": {
        "dataType": "refAlias",
        "type": {"dataType":"union","subSchemas":[{"dataType":"enum","enums":["name"]},{"dataType":"enum","enums":["email"]},{"dataType":"enum","enums":["createdAt"]},{"dataType":"enum","enums":["role"]}],"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ObjectId": {
        "dataType": "refAlias",
        "type": {"dataType":"string","validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Pick_User.Exclude_keyofUser.password__": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"name":{"dataType":"string","required":true},"email":{"dataType":"string","required":true},"createdAt":{"dataType":"datetime"},"role":{"dataType":"union","subSchemas":[{"dataType":"enum","enums":["user"]},{"dataType":"enum","enums":["admin"]},{"dataType":"enum","enums":["superadmin"]}]},"phone":{"dataType":"string"},"orders":{"dataType":"array","array":{"dataType":"refAlias","ref":"ObjectId"}},"addresses":{"dataType":"array","array":{"dataType":"refAlias","ref":"ObjectId"}},"googleId":{"dataType":"string"},"facebookId":{"dataType":"string"},"avatar":{"dataType":"string"},"_id":{"ref":"ObjectId"},"updatedAt":{"dataType":"datetime"}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Omit_User.password_": {
        "dataType": "refAlias",
        "type": {"ref":"Pick_User.Exclude_keyofUser.password__","validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "CreateUserRequest": {
        "dataType": "refObject",
        "properties": {
            "name": {"dataType":"string","required":true},
            "email": {"dataType":"string","required":true},
            "password": {"dataType":"string","required":true},
            "phone": {"dataType":"string","required":true},
            "role": {"dataType":"union","subSchemas":[{"dataType":"enum","enums":["user"]},{"dataType":"enum","enums":["admin"]}]},
        },
        "additionalProperties": true,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "UpdateUserRequest": {
        "dataType": "refObject",
        "properties": {
            "_id": {"ref":"ObjectId"},
            "createdAt": {"dataType":"datetime"},
            "updatedAt": {"dataType":"datetime"},
            "name": {"dataType":"string"},
            "email": {"dataType":"string"},
            "password": {"dataType":"string"},
            "phone": {"dataType":"string","required":true},
            "role": {"dataType":"union","subSchemas":[{"dataType":"enum","enums":["user"]},{"dataType":"enum","enums":["admin"]},{"dataType":"enum","enums":["superadmin"]}]},
        },
        "additionalProperties": true,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ProductContent": {
        "dataType": "refObject",
        "properties": {
            "description": {"dataType":"string","required":true},
            "feature": {"dataType":"array","array":{"dataType":"string"},"required":true},
            "care": {"dataType":"array","array":{"dataType":"string"},"required":true},
        },
        "additionalProperties": true,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ProductVariant": {
        "dataType": "refObject",
        "properties": {
            "color": {"dataType":"array","array":{"dataType":"string"},"required":true},
            "size": {"dataType":"array","array":{"dataType":"string"},"required":true},
        },
        "additionalProperties": true,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ProductMedia": {
        "dataType": "refObject",
        "properties": {
            "images": {"dataType":"array","array":{"dataType":"string"},"required":true},
            "video": {"dataType":"string","required":true},
        },
        "additionalProperties": true,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "CreateProductRequest": {
        "dataType": "refObject",
        "properties": {
            "sku": {"dataType":"string","required":true},
            "name": {"dataType":"string","required":true},
            "price": {"dataType":"double","required":true},
            "product_type": {"dataType":"string","required":true},
            "partner": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},
            "set": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},
            "content": {"dataType":"union","subSchemas":[{"ref":"ProductContent"},{"dataType":"enum","enums":[null]}],"required":true},
            "variant": {"dataType":"union","subSchemas":[{"ref":"ProductVariant"},{"dataType":"enum","enums":[null]}],"required":true},
            "media": {"dataType":"union","subSchemas":[{"ref":"ProductMedia"},{"dataType":"enum","enums":[null]}],"required":true},
            "tags": {"dataType":"union","subSchemas":[{"dataType":"array","array":{"dataType":"string"}},{"dataType":"enum","enums":[null]}],"required":true},
            "sale_price": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"double"},{"dataType":"enum","enums":[null]}],"required":true},
            "sale_period": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},
            "parent": {"dataType":"array","array":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}]},"required":true},
            "children": {"dataType":"union","subSchemas":[{"dataType":"array","array":{"dataType":"string"}},{"dataType":"enum","enums":[null]}],"required":true},
            "recommended": {"dataType":"union","subSchemas":[{"dataType":"array","array":{"dataType":"string"}},{"dataType":"enum","enums":[null]}],"required":true},
        },
        "additionalProperties": true,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Product": {
        "dataType": "refObject",
        "properties": {
            "_id": {"ref":"ObjectId"},
            "createdAt": {"dataType":"datetime"},
            "updatedAt": {"dataType":"datetime"},
            "sku": {"dataType":"string","required":true},
            "name": {"dataType":"string","required":true},
            "price": {"dataType":"double","required":true},
            "product_type": {"dataType":"string","required":true},
            "partner": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},
            "set": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},
            "content": {"dataType":"union","subSchemas":[{"ref":"ProductContent"},{"dataType":"enum","enums":[null]}],"required":true},
            "variant": {"dataType":"union","subSchemas":[{"ref":"ProductVariant"},{"dataType":"enum","enums":[null]}],"required":true},
            "media": {"dataType":"union","subSchemas":[{"ref":"ProductMedia"},{"dataType":"enum","enums":[null]}],"required":true},
            "tags": {"dataType":"union","subSchemas":[{"dataType":"array","array":{"dataType":"string"}},{"dataType":"enum","enums":[null]}],"required":true},
            "sale_price": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"double"},{"dataType":"enum","enums":[null]}],"required":true},
            "sale_period": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}],"required":true},
            "parent": {"dataType":"union","subSchemas":[{"dataType":"array","array":{"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}]}},{"dataType":"enum","enums":[null]}],"required":true},
            "children": {"dataType":"union","subSchemas":[{"dataType":"array","array":{"dataType":"string"}},{"dataType":"enum","enums":[null]}],"required":true},
            "recommended": {"dataType":"union","subSchemas":[{"dataType":"array","array":{"dataType":"string"}},{"dataType":"enum","enums":[null]}],"required":true},
        },
        "additionalProperties": true,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ProductSortKey": {
        "dataType": "refAlias",
        "type": {"dataType":"union","subSchemas":[{"dataType":"enum","enums":["sku"]},{"dataType":"enum","enums":["name"]},{"dataType":"enum","enums":["price"]},{"dataType":"enum","enums":["product_type"]},{"dataType":"enum","enums":["partner"]},{"dataType":"enum","enums":["set"]},{"dataType":"enum","enums":["sale_price"]},{"dataType":"enum","enums":["sale_period"]},{"dataType":"enum","enums":["createdAt"]},{"dataType":"enum","enums":["updatedAt"]}],"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "SortOrder": {
        "dataType": "refAlias",
        "type": {"dataType":"union","subSchemas":[{"dataType":"enum","enums":["asc"]},{"dataType":"enum","enums":["desc"]}],"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "UpdateProductRequest": {
        "dataType": "refObject",
        "properties": {
            "sku": {"dataType":"string"},
            "name": {"dataType":"string"},
            "price": {"dataType":"double"},
            "product_type": {"dataType":"string"},
            "partner": {"dataType":"string"},
            "set": {"dataType":"string"},
            "content": {"ref":"ProductContent"},
            "variant": {"ref":"ProductVariant"},
            "media": {"ref":"ProductMedia"},
            "tags": {"dataType":"array","array":{"dataType":"string"}},
            "sale_price": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"double"}]},
            "sale_period": {"dataType":"string"},
            "parent": {"dataType":"array","array":{"dataType":"string"}},
            "children": {"dataType":"array","array":{"dataType":"string"}},
            "recommended": {"dataType":"array","array":{"dataType":"string"}},
            "updatedAt": {"dataType":"datetime"},
        },
        "additionalProperties": true,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "SendOtpBody": {
        "dataType": "refObject",
        "properties": {
            "email": {"dataType":"string"},
            "mobile_number": {"dataType":"string"},
            "origin": {"dataType":"string"},
        },
        "additionalProperties": true,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "OtpCheckBody": {
        "dataType": "refObject",
        "properties": {
            "otp": {"dataType":"string","required":true},
            "registration_code": {"dataType":"string"},
        },
        "additionalProperties": true,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "OtpCheckMobileBody": {
        "dataType": "refObject",
        "properties": {
            "otp": {"dataType":"string","required":true},
            "requestId": {"dataType":"any"},
        },
        "additionalProperties": true,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "LoginModel": {
        "dataType": "refObject",
        "properties": {
            "userName": {"dataType":"string","required":true},
            "userEmail": {"dataType":"string","required":true},
            "password": {"dataType":"string","required":true},
        },
        "additionalProperties": true,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
};
const templateService = new ExpressTemplateService(models, {"noImplicitAdditionalProperties":"ignore","bodyCoercion":true});

// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa




export function RegisterRoutes(app: Router) {

    // ###########################################################################################################
    //  NOTE: If you do not see routes for all of your controllers in this file, then you might not have informed tsoa of where to look
    //      Please look into the "controllerPathGlobs" config option described in the readme: https://github.com/lukeautry/tsoa
    // ###########################################################################################################


    
        const argsUserController_getAllUsers: Record<string, TsoaRoute.ParameterSchema> = {
                filtersJson: {"in":"query","name":"filters","dataType":"string"},
                limit: {"default":20,"in":"query","name":"limit","dataType":"double"},
                skip: {"default":0,"in":"query","name":"skip","dataType":"double"},
                sortBy: {"default":"name","in":"query","name":"sortBy","ref":"UserSortKey"},
                sortOrder: {"default":"asc","in":"query","name":"sortOrder","dataType":"union","subSchemas":[{"dataType":"enum","enums":["asc"]},{"dataType":"enum","enums":["desc"]}]},
        };
        app.get('/users',
            ...(fetchMiddlewares<RequestHandler>(UserController)),
            ...(fetchMiddlewares<RequestHandler>(UserController.prototype.getAllUsers)),

            async function UserController_getAllUsers(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsUserController_getAllUsers, request, response });

                const controller = new UserController();

              await templateService.apiHandler({
                methodName: 'getAllUsers',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsUserController_getUserById: Record<string, TsoaRoute.ParameterSchema> = {
                id: {"in":"path","name":"id","required":true,"dataType":"string"},
        };
        app.get('/users/:id',
            ...(fetchMiddlewares<RequestHandler>(UserController)),
            ...(fetchMiddlewares<RequestHandler>(UserController.prototype.getUserById)),

            async function UserController_getUserById(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsUserController_getUserById, request, response });

                const controller = new UserController();

              await templateService.apiHandler({
                methodName: 'getUserById',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsUserController_createUser: Record<string, TsoaRoute.ParameterSchema> = {
                userData: {"in":"body","name":"userData","required":true,"ref":"CreateUserRequest"},
        };
        app.post('/users',
            ...(fetchMiddlewares<RequestHandler>(UserController)),
            ...(fetchMiddlewares<RequestHandler>(UserController.prototype.createUser)),

            async function UserController_createUser(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsUserController_createUser, request, response });

                const controller = new UserController();

              await templateService.apiHandler({
                methodName: 'createUser',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: 201,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsUserController_updateUser: Record<string, TsoaRoute.ParameterSchema> = {
                id: {"in":"path","name":"id","required":true,"dataType":"string"},
                updateData: {"in":"body","name":"updateData","required":true,"ref":"UpdateUserRequest"},
        };
        app.put('/users/:id',
            ...(fetchMiddlewares<RequestHandler>(UserController)),
            ...(fetchMiddlewares<RequestHandler>(UserController.prototype.updateUser)),

            async function UserController_updateUser(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsUserController_updateUser, request, response });

                const controller = new UserController();

              await templateService.apiHandler({
                methodName: 'updateUser',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsProductConroller_createProduct: Record<string, TsoaRoute.ParameterSchema> = {
                body: {"in":"body","name":"body","required":true,"ref":"CreateProductRequest"},
        };
        app.post('/products',
            ...(fetchMiddlewares<RequestHandler>(ProductConroller)),
            ...(fetchMiddlewares<RequestHandler>(ProductConroller.prototype.createProduct)),

            async function ProductConroller_createProduct(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsProductConroller_createProduct, request, response });

                const controller = new ProductConroller();

              await templateService.apiHandler({
                methodName: 'createProduct',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsProductConroller_getAllProducts: Record<string, TsoaRoute.ParameterSchema> = {
                limit: {"default":20,"in":"query","name":"limit","dataType":"double"},
                skip: {"default":0,"in":"query","name":"skip","dataType":"double"},
                sortBy: {"default":"createdAt","in":"query","name":"sortBy","ref":"ProductSortKey"},
                sortOrder: {"default":"desc","in":"query","name":"sortOrder","ref":"SortOrder"},
                name: {"in":"query","name":"name","dataType":"string"},
                minPrice: {"in":"query","name":"minPrice","dataType":"double"},
                maxPrice: {"in":"query","name":"maxPrice","dataType":"double"},
                product_type: {"in":"query","name":"product_type","dataType":"string"},
                tags: {"in":"query","name":"tags","dataType":"string"},
        };
        app.get('/products',
            ...(fetchMiddlewares<RequestHandler>(ProductConroller)),
            ...(fetchMiddlewares<RequestHandler>(ProductConroller.prototype.getAllProducts)),

            async function ProductConroller_getAllProducts(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsProductConroller_getAllProducts, request, response });

                const controller = new ProductConroller();

              await templateService.apiHandler({
                methodName: 'getAllProducts',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: 200,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsProductConroller_getProductById: Record<string, TsoaRoute.ParameterSchema> = {
                id: {"in":"path","name":"id","required":true,"dataType":"string"},
        };
        app.get('/products/:id',
            ...(fetchMiddlewares<RequestHandler>(ProductConroller)),
            ...(fetchMiddlewares<RequestHandler>(ProductConroller.prototype.getProductById)),

            async function ProductConroller_getProductById(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsProductConroller_getProductById, request, response });

                const controller = new ProductConroller();

              await templateService.apiHandler({
                methodName: 'getProductById',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: 200,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsProductConroller_updateProduct: Record<string, TsoaRoute.ParameterSchema> = {
                id: {"in":"path","name":"id","required":true,"dataType":"string"},
                body: {"in":"body","name":"body","required":true,"ref":"UpdateProductRequest"},
        };
        app.put('/products/:id',
            ...(fetchMiddlewares<RequestHandler>(ProductConroller)),
            ...(fetchMiddlewares<RequestHandler>(ProductConroller.prototype.updateProduct)),

            async function ProductConroller_updateProduct(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsProductConroller_updateProduct, request, response });

                const controller = new ProductConroller();

              await templateService.apiHandler({
                methodName: 'updateProduct',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: 200,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsProductConroller_deleteProduct: Record<string, TsoaRoute.ParameterSchema> = {
                id: {"in":"path","name":"id","required":true,"dataType":"string"},
        };
        app.delete('/products/:id',
            ...(fetchMiddlewares<RequestHandler>(ProductConroller)),
            ...(fetchMiddlewares<RequestHandler>(ProductConroller.prototype.deleteProduct)),

            async function ProductConroller_deleteProduct(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsProductConroller_deleteProduct, request, response });

                const controller = new ProductConroller();

              await templateService.apiHandler({
                methodName: 'deleteProduct',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: 200,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsOtpController_sendOtpEmail: Record<string, TsoaRoute.ParameterSchema> = {
                body: {"in":"body","name":"body","required":true,"ref":"SendOtpBody"},
                req: {"in":"request","name":"req","required":true,"dataType":"object"},
        };
        app.post('/otp/send-email',
            ...(fetchMiddlewares<RequestHandler>(OtpController)),
            ...(fetchMiddlewares<RequestHandler>(OtpController.prototype.sendOtpEmail)),

            async function OtpController_sendOtpEmail(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsOtpController_sendOtpEmail, request, response });

                const controller = new OtpController();

              await templateService.apiHandler({
                methodName: 'sendOtpEmail',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: 200,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsOtpController_sendOtpMobile: Record<string, TsoaRoute.ParameterSchema> = {
                body: {"in":"body","name":"body","required":true,"ref":"SendOtpBody"},
        };
        app.post('/otp/send-mobile',
            ...(fetchMiddlewares<RequestHandler>(OtpController)),
            ...(fetchMiddlewares<RequestHandler>(OtpController.prototype.sendOtpMobile)),

            async function OtpController_sendOtpMobile(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsOtpController_sendOtpMobile, request, response });

                const controller = new OtpController();

              await templateService.apiHandler({
                methodName: 'sendOtpMobile',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: 200,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsOtpController_checkOtpEmail: Record<string, TsoaRoute.ParameterSchema> = {
                body: {"in":"body","name":"body","required":true,"ref":"OtpCheckBody"},
                req: {"in":"request","name":"req","required":true,"dataType":"object"},
        };
        app.post('/otp/check-email',
            ...(fetchMiddlewares<RequestHandler>(OtpController)),
            ...(fetchMiddlewares<RequestHandler>(OtpController.prototype.checkOtpEmail)),

            async function OtpController_checkOtpEmail(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsOtpController_checkOtpEmail, request, response });

                const controller = new OtpController();

              await templateService.apiHandler({
                methodName: 'checkOtpEmail',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsOtpController_checkOtpMobile: Record<string, TsoaRoute.ParameterSchema> = {
                body: {"in":"body","name":"body","required":true,"ref":"OtpCheckMobileBody"},
        };
        app.post('/otp/check-mobile',
            ...(fetchMiddlewares<RequestHandler>(OtpController)),
            ...(fetchMiddlewares<RequestHandler>(OtpController.prototype.checkOtpMobile)),

            async function OtpController_checkOtpMobile(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsOtpController_checkOtpMobile, request, response });

                const controller = new OtpController();

              await templateService.apiHandler({
                methodName: 'checkOtpMobile',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsClientController_getLargeJson: Record<string, TsoaRoute.ParameterSchema> = {
        };
        app.get('/client',
            ...(fetchMiddlewares<RequestHandler>(ClientController)),
            ...(fetchMiddlewares<RequestHandler>(ClientController.prototype.getLargeJson)),

            async function ClientController_getLargeJson(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsClientController_getLargeJson, request, response });

                const controller = new ClientController();

              await templateService.apiHandler({
                methodName: 'getLargeJson',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsAuthController_getGoogleAuthUrl: Record<string, TsoaRoute.ParameterSchema> = {
        };
        app.get('/auth/google/url',
            ...(fetchMiddlewares<RequestHandler>(AuthController)),
            ...(fetchMiddlewares<RequestHandler>(AuthController.prototype.getGoogleAuthUrl)),

            async function AuthController_getGoogleAuthUrl(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsAuthController_getGoogleAuthUrl, request, response });

                const controller = new AuthController();

              await templateService.apiHandler({
                methodName: 'getGoogleAuthUrl',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsAuthController_googleCallback: Record<string, TsoaRoute.ParameterSchema> = {
                code: {"in":"query","name":"code","required":true,"dataType":"string"},
        };
        app.get('/auth/google/callback',
            ...(fetchMiddlewares<RequestHandler>(AuthController)),
            ...(fetchMiddlewares<RequestHandler>(AuthController.prototype.googleCallback)),

            async function AuthController_googleCallback(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsAuthController_googleCallback, request, response });

                const controller = new AuthController();

              await templateService.apiHandler({
                methodName: 'googleCallback',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: 302,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsAuthController_getFacebookAuthUrl: Record<string, TsoaRoute.ParameterSchema> = {
        };
        app.get('/auth/facebook/url',
            ...(fetchMiddlewares<RequestHandler>(AuthController)),
            ...(fetchMiddlewares<RequestHandler>(AuthController.prototype.getFacebookAuthUrl)),

            async function AuthController_getFacebookAuthUrl(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsAuthController_getFacebookAuthUrl, request, response });

                const controller = new AuthController();

              await templateService.apiHandler({
                methodName: 'getFacebookAuthUrl',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsAuthController_facebookCallback: Record<string, TsoaRoute.ParameterSchema> = {
                code: {"in":"query","name":"code","required":true,"dataType":"string"},
        };
        app.get('/auth/facebook/callback',
            ...(fetchMiddlewares<RequestHandler>(AuthController)),
            ...(fetchMiddlewares<RequestHandler>(AuthController.prototype.facebookCallback)),

            async function AuthController_facebookCallback(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsAuthController_facebookCallback, request, response });

                const controller = new AuthController();

              await templateService.apiHandler({
                methodName: 'facebookCallback',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: 302,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsAuthController_getProfile: Record<string, TsoaRoute.ParameterSchema> = {
                req: {"in":"request","name":"req","required":true,"dataType":"object"},
        };
        app.get('/auth/profile',
            ...(fetchMiddlewares<RequestHandler>(AuthController)),
            ...(fetchMiddlewares<RequestHandler>(AuthController.prototype.getProfile)),

            async function AuthController_getProfile(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsAuthController_getProfile, request, response });

                const controller = new AuthController();

              await templateService.apiHandler({
                methodName: 'getProfile',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: 200,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsAuthController_verifyToken: Record<string, TsoaRoute.ParameterSchema> = {
                req: {"in":"request","name":"req","required":true,"dataType":"object"},
        };
        app.get('/auth/verify-token',
            ...(fetchMiddlewares<RequestHandler>(AuthController)),
            ...(fetchMiddlewares<RequestHandler>(AuthController.prototype.verifyToken)),

            async function AuthController_verifyToken(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsAuthController_verifyToken, request, response });

                const controller = new AuthController();

              await templateService.apiHandler({
                methodName: 'verifyToken',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: 200,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsAuthController_loginUser: Record<string, TsoaRoute.ParameterSchema> = {
                userData: {"in":"body","name":"userData","required":true,"ref":"LoginModel"},
        };
        app.post('/auth/login',
            ...(fetchMiddlewares<RequestHandler>(AuthController)),
            ...(fetchMiddlewares<RequestHandler>(AuthController.prototype.loginUser)),

            async function AuthController_loginUser(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsAuthController_loginUser, request, response });

                const controller = new AuthController();

              await templateService.apiHandler({
                methodName: 'loginUser',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
        const argsAuthController_logoutUser: Record<string, TsoaRoute.ParameterSchema> = {
        };
        app.post('/auth/logout',
            ...(fetchMiddlewares<RequestHandler>(AuthController)),
            ...(fetchMiddlewares<RequestHandler>(AuthController.prototype.logoutUser)),

            async function AuthController_logoutUser(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsAuthController_logoutUser, request, response });

                const controller = new AuthController();

              await templateService.apiHandler({
                methodName: 'logoutUser',
                controller,
                response,
                next,
                validatedArgs,
                successStatus: undefined,
              });
            } catch (err) {
                return next(err);
            }
        });
        // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa


    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
}

// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
