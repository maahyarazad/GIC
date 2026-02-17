/* tslint:disable */
/* eslint-disable */
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import type { TsoaRoute } from '@tsoa/runtime';
import {  fetchMiddlewares, ExpressTemplateService } from '@tsoa/runtime';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { EmailTemplateController } from './../controllers/email.controller';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { UserController } from './../controllers/user.controller';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { SitemapController } from './../controllers/sitemap.controller';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { ProductController } from './../controllers/product.controller';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { OtpController } from './../controllers/otp.controller';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { NewsletterController } from './../controllers/newsletter.controller';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { LogController } from './../controllers/log.controller';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { FileController } from './../controllers/file.controller';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { ContinentController } from './../controllers/continent.controller';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { ClientController } from './../controllers/client.controller';
// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
import { AuthController } from './../controllers/auth.controller';
import type { Request as ExRequest, Response as ExResponse, RequestHandler, Router } from 'express';
const multer = require('multer');




// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

const models: TsoaRoute.Models = {
    "EmailTemplateDoc": {
        "dataType": "refObject",
        "properties": {
            "name": {"dataType":"string","required":true},
            "subject": {"dataType":"string","required":true},
            "html": {"dataType":"string","required":true},
            "text": {"dataType":"string"},
            "variables": {"dataType":"array","array":{"dataType":"string"}},
            "createdAt": {"dataType":"datetime"},
            "updatedAt": {"dataType":"datetime"},
        },
        "additionalProperties": true,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "SuccessResponse_EmailTemplateDoc_": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"pagination":{"dataType":"nestedObjectLiteral","nestedProperties":{"pages":{"dataType":"double","required":true},"total":{"dataType":"double","required":true},"limit":{"dataType":"double","required":true},"page":{"dataType":"double","required":true}}},"timestamp":{"dataType":"string","required":true},"data":{"ref":"EmailTemplateDoc"},"message":{"dataType":"string"},"success":{"dataType":"enum","enums":[true],"required":true}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ErrorResponse": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"timestamp":{"dataType":"string","required":true},"error":{"dataType":"nestedObjectLiteral","nestedProperties":{"details":{"dataType":"any"},"code":{"dataType":"string"},"message":{"dataType":"string","required":true}},"required":true},"message":{"dataType":"string","required":true},"success":{"dataType":"enum","enums":[false],"required":true}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ApiResponse_EmailTemplateDoc_": {
        "dataType": "refAlias",
        "type": {"dataType":"union","subSchemas":[{"ref":"SuccessResponse_EmailTemplateDoc_"},{"ref":"ErrorResponse"}],"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "SuccessResponse_EmailTemplateDoc-Array_": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"pagination":{"dataType":"nestedObjectLiteral","nestedProperties":{"pages":{"dataType":"double","required":true},"total":{"dataType":"double","required":true},"limit":{"dataType":"double","required":true},"page":{"dataType":"double","required":true}}},"timestamp":{"dataType":"string","required":true},"data":{"dataType":"array","array":{"dataType":"refObject","ref":"EmailTemplateDoc"}},"message":{"dataType":"string"},"success":{"dataType":"enum","enums":[true],"required":true}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ApiResponse_EmailTemplateDoc-Array_": {
        "dataType": "refAlias",
        "type": {"dataType":"union","subSchemas":[{"ref":"SuccessResponse_EmailTemplateDoc-Array_"},{"ref":"ErrorResponse"}],"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "SuccessResponse_null_": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"pagination":{"dataType":"nestedObjectLiteral","nestedProperties":{"pages":{"dataType":"double","required":true},"total":{"dataType":"double","required":true},"limit":{"dataType":"double","required":true},"page":{"dataType":"double","required":true}}},"timestamp":{"dataType":"string","required":true},"data":{"dataType":"enum","enums":[null]},"message":{"dataType":"string"},"success":{"dataType":"enum","enums":[true],"required":true}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ApiResponse_null_": {
        "dataType": "refAlias",
        "type": {"dataType":"union","subSchemas":[{"ref":"SuccessResponse_null_"},{"ref":"ErrorResponse"}],"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Partial_EmailTemplateDoc_": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"name":{"dataType":"string"},"subject":{"dataType":"string"},"html":{"dataType":"string"},"text":{"dataType":"string"},"variables":{"dataType":"array","array":{"dataType":"string"}},"createdAt":{"dataType":"datetime"},"updatedAt":{"dataType":"datetime"}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
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
    "SocialLink": {
        "dataType": "refObject",
        "properties": {
            "platform": {"dataType":"string","required":true},
            "url": {"dataType":"string","required":true},
        },
        "additionalProperties": true,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Pick_User.Exclude_keyofUser.password__": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"name":{"dataType":"string","required":true},"createdAt":{"dataType":"datetime"},"updatedAt":{"dataType":"datetime"},"email":{"dataType":"string","required":true},"role":{"dataType":"union","subSchemas":[{"dataType":"enum","enums":["user"]},{"dataType":"enum","enums":["admin"]},{"dataType":"enum","enums":["superadmin"]}]},"phone":{"dataType":"string"},"orders":{"dataType":"array","array":{"dataType":"refAlias","ref":"ObjectId"}},"addresses":{"dataType":"array","array":{"dataType":"refAlias","ref":"ObjectId"}},"authorize":{"dataType":"boolean","required":true},"googleId":{"dataType":"string"},"facebookId":{"dataType":"string"},"avatar":{"dataType":"string"},"profile":{"dataType":"nestedObjectLiteral","nestedProperties":{"socialLinks":{"dataType":"array","array":{"dataType":"refObject","ref":"SocialLink"}},"description":{"dataType":"string"},"title":{"dataType":"string"},"photo":{"dataType":"string"}}},"_id":{"ref":"ObjectId"}},"validators":{}},
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
            "authorize": {"dataType":"boolean","required":true},
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
            "phone": {"dataType":"string"},
            "role": {"dataType":"union","subSchemas":[{"dataType":"enum","enums":["user"]},{"dataType":"enum","enums":["admin"]},{"dataType":"enum","enums":["superadmin"]}]},
            "authorize": {"dataType":"boolean"},
            "profile": {"dataType":"nestedObjectLiteral","nestedProperties":{"socialLinks":{"dataType":"array","array":{"dataType":"refObject","ref":"SocialLink"}},"description":{"dataType":"string"},"title":{"dataType":"string"},"photo":{"dataType":"string"}}},
        },
        "additionalProperties": true,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "SuccessResponse__photoUrl-string__": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"pagination":{"dataType":"nestedObjectLiteral","nestedProperties":{"pages":{"dataType":"double","required":true},"total":{"dataType":"double","required":true},"limit":{"dataType":"double","required":true},"page":{"dataType":"double","required":true}}},"timestamp":{"dataType":"string","required":true},"data":{"dataType":"nestedObjectLiteral","nestedProperties":{"photoUrl":{"dataType":"string","required":true}}},"message":{"dataType":"string"},"success":{"dataType":"enum","enums":[true],"required":true}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ProductContent": {
        "dataType": "refObject",
        "properties": {
            "description": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}]},
            "shortDescription": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}]},
            "highlights": {"dataType":"union","subSchemas":[{"dataType":"array","array":{"dataType":"string"}},{"dataType":"enum","enums":[null]}]},
            "features": {"dataType":"union","subSchemas":[{"dataType":"array","array":{"dataType":"string"}},{"dataType":"enum","enums":[null]}]},
        },
        "additionalProperties": true,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ProductVariant": {
        "dataType": "refObject",
        "properties": {
            "variantName": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}]},
            "variantValue": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}]},
        },
        "additionalProperties": true,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ProductMedia": {
        "dataType": "refObject",
        "properties": {
            "images": {"dataType":"union","subSchemas":[{"dataType":"array","array":{"dataType":"string"}},{"dataType":"enum","enums":[null]}]},
            "imageAlt": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}]},
            "video": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}]},
            "seoTitle": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}]},
            "seoDescription": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}]},
            "seoKeywords": {"dataType":"union","subSchemas":[{"dataType":"array","array":{"dataType":"string"}},{"dataType":"enum","enums":[null]}]},
        },
        "additionalProperties": true,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "CreateProductRequest": {
        "dataType": "refObject",
        "properties": {
            "fileId": {"dataType":"string","required":true},
            "name": {"dataType":"string","required":true},
            "content": {"dataType":"union","subSchemas":[{"ref":"ProductContent"},{"dataType":"enum","enums":[null]}],"required":true},
            "variant": {"dataType":"union","subSchemas":[{"ref":"ProductVariant"},{"dataType":"enum","enums":[null]}],"required":true},
            "media": {"dataType":"union","subSchemas":[{"ref":"ProductMedia"},{"dataType":"enum","enums":[null]}],"required":true},
            "tags": {"dataType":"union","subSchemas":[{"dataType":"array","array":{"dataType":"string"}},{"dataType":"enum","enums":[null]}],"required":true},
            "downloadCount": {"dataType":"double"},
            "importance": {"dataType":"double"},
            "parent": {"dataType":"union","subSchemas":[{"ref":"ObjectId"},{"dataType":"enum","enums":[null]}]},
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
            "fileId": {"dataType":"string","required":true},
            "name": {"dataType":"string","required":true},
            "code": {"dataType":"string","required":true},
            "content": {"dataType":"union","subSchemas":[{"ref":"ProductContent"},{"dataType":"enum","enums":[null]}],"required":true},
            "variant": {"dataType":"union","subSchemas":[{"ref":"ProductVariant"},{"dataType":"enum","enums":[null]}],"required":true},
            "media": {"dataType":"union","subSchemas":[{"ref":"ProductMedia"},{"dataType":"enum","enums":[null]}],"required":true},
            "tags": {"dataType":"union","subSchemas":[{"dataType":"array","array":{"dataType":"string"}},{"dataType":"enum","enums":[null]}],"required":true},
            "downloadCount": {"dataType":"double","required":true},
            "importance": {"dataType":"union","subSchemas":[{"dataType":"enum","enums":["A"]},{"dataType":"enum","enums":["B"]},{"dataType":"enum","enums":["C"]},{"dataType":"enum","enums":["D"]}],"required":true},
            "parent": {"dataType":"union","subSchemas":[{"ref":"ObjectId"},{"dataType":"enum","enums":[null]}]},
            "children": {"dataType":"union","subSchemas":[{"dataType":"array","array":{"dataType":"string"}},{"dataType":"enum","enums":[null]}],"required":true},
            "recommended": {"dataType":"union","subSchemas":[{"dataType":"array","array":{"dataType":"string"}},{"dataType":"enum","enums":[null]}],"required":true},
        },
        "additionalProperties": true,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ProductSortKey": {
        "dataType": "refAlias",
        "type": {"dataType":"union","subSchemas":[{"dataType":"enum","enums":["fileId"]},{"dataType":"enum","enums":["name"]},{"dataType":"enum","enums":["downloadCount"]},{"dataType":"enum","enums":["importance"]},{"dataType":"enum","enums":["createdAt"]},{"dataType":"enum","enums":["updatedAt"]}],"validators":{}},
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
            "fileId": {"dataType":"string"},
            "name": {"dataType":"string"},
            "content": {"ref":"ProductContent"},
            "variant": {"ref":"ProductVariant"},
            "media": {"ref":"ProductMedia"},
            "tags": {"dataType":"array","array":{"dataType":"string"}},
            "downloadCount": {"dataType":"double"},
            "importance": {"dataType":"double"},
            "parent": {"ref":"ObjectId"},
            "children": {"dataType":"array","array":{"dataType":"string"}},
            "recommended": {"dataType":"array","array":{"dataType":"string"}},
            "updatedAt": {"dataType":"datetime"},
        },
        "additionalProperties": true,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "SuccessResponse__otpSent-boolean__": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"pagination":{"dataType":"nestedObjectLiteral","nestedProperties":{"pages":{"dataType":"double","required":true},"total":{"dataType":"double","required":true},"limit":{"dataType":"double","required":true},"page":{"dataType":"double","required":true}}},"timestamp":{"dataType":"string","required":true},"data":{"dataType":"nestedObjectLiteral","nestedProperties":{"otpSent":{"dataType":"boolean","required":true}}},"message":{"dataType":"string"},"success":{"dataType":"enum","enums":[true],"required":true}},"validators":{}},
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
    "SuccessResponse_any_": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"pagination":{"dataType":"nestedObjectLiteral","nestedProperties":{"pages":{"dataType":"double","required":true},"total":{"dataType":"double","required":true},"limit":{"dataType":"double","required":true},"page":{"dataType":"double","required":true}}},"timestamp":{"dataType":"string","required":true},"data":{"dataType":"any"},"message":{"dataType":"string"},"success":{"dataType":"enum","enums":[true],"required":true}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "SuccessResponse____": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"pagination":{"dataType":"nestedObjectLiteral","nestedProperties":{"pages":{"dataType":"double","required":true},"total":{"dataType":"double","required":true},"limit":{"dataType":"double","required":true},"page":{"dataType":"double","required":true}}},"timestamp":{"dataType":"string","required":true},"data":{"dataType":"nestedObjectLiteral","nestedProperties":{}},"message":{"dataType":"string"},"success":{"dataType":"enum","enums":[true],"required":true}},"validators":{}},
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
    "SuccessResponse_unknown_": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"pagination":{"dataType":"nestedObjectLiteral","nestedProperties":{"pages":{"dataType":"double","required":true},"total":{"dataType":"double","required":true},"limit":{"dataType":"double","required":true},"page":{"dataType":"double","required":true}}},"timestamp":{"dataType":"string","required":true},"data":{"dataType":"any"},"message":{"dataType":"string"},"success":{"dataType":"enum","enums":[true],"required":true}},"validators":{}},
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
    "NewsletterSubscriber": {
        "dataType": "refObject",
        "properties": {
            "_id": {"ref":"ObjectId"},
            "createdAt": {"dataType":"datetime"},
            "updatedAt": {"dataType":"datetime"},
            "email": {"dataType":"string","required":true},
            "active": {"dataType":"boolean","required":true},
        },
        "additionalProperties": true,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "SuccessResponse_NewsletterSubscriber_": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"pagination":{"dataType":"nestedObjectLiteral","nestedProperties":{"pages":{"dataType":"double","required":true},"total":{"dataType":"double","required":true},"limit":{"dataType":"double","required":true},"page":{"dataType":"double","required":true}}},"timestamp":{"dataType":"string","required":true},"data":{"ref":"NewsletterSubscriber"},"message":{"dataType":"string"},"success":{"dataType":"enum","enums":[true],"required":true}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ApiResponse_NewsletterSubscriber_": {
        "dataType": "refAlias",
        "type": {"dataType":"union","subSchemas":[{"ref":"SuccessResponse_NewsletterSubscriber_"},{"ref":"ErrorResponse"}],"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Pick_NewsletterSubscriber.email-or-active_": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"email":{"dataType":"string","required":true},"active":{"dataType":"boolean","required":true}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ApiResponse_any_": {
        "dataType": "refAlias",
        "type": {"dataType":"union","subSchemas":[{"ref":"SuccessResponse_any_"},{"ref":"ErrorResponse"}],"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "Partial_NewsletterSubscriber_": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"email":{"dataType":"string"},"active":{"dataType":"boolean"},"_id":{"ref":"ObjectId"},"createdAt":{"dataType":"datetime"},"updatedAt":{"dataType":"datetime"}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "UploadedFileDoc": {
        "dataType": "refObject",
        "properties": {
            "filename": {"dataType":"string","required":true},
            "mimetype": {"dataType":"string","required":true},
            "extension": {"dataType":"string","required":true},
            "path": {"dataType":"string","required":true},
            "size": {"dataType":"double","required":true},
            "createdAt": {"dataType":"datetime","required":true},
        },
        "additionalProperties": true,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "SuccessResponse__files-UploadedFileDoc-Array--total-number__": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"pagination":{"dataType":"nestedObjectLiteral","nestedProperties":{"pages":{"dataType":"double","required":true},"total":{"dataType":"double","required":true},"limit":{"dataType":"double","required":true},"page":{"dataType":"double","required":true}}},"timestamp":{"dataType":"string","required":true},"data":{"dataType":"nestedObjectLiteral","nestedProperties":{"total":{"dataType":"double","required":true},"files":{"dataType":"array","array":{"dataType":"refObject","ref":"UploadedFileDoc"},"required":true}}},"message":{"dataType":"string"},"success":{"dataType":"enum","enums":[true],"required":true}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ApiResponse__files-UploadedFileDoc-Array--total-number__": {
        "dataType": "refAlias",
        "type": {"dataType":"union","subSchemas":[{"ref":"SuccessResponse__files-UploadedFileDoc-Array--total-number__"},{"ref":"ErrorResponse"}],"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "CreateContinentRequest": {
        "dataType": "refObject",
        "properties": {
            "_id": {"ref":"ObjectId"},
            "createdAt": {"dataType":"datetime"},
            "updatedAt": {"dataType":"datetime"},
            "name": {"dataType":"string","required":true},
            "slug": {"dataType":"string","required":true},
            "description": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}]},
            "products": {"dataType":"union","subSchemas":[{"dataType":"array","array":{"dataType":"union","subSchemas":[{"ref":"ObjectId"},{"dataType":"enum","enums":[null]}]}},{"dataType":"enum","enums":[null]}]},
            "productObjects": {"dataType":"union","subSchemas":[{"dataType":"array","array":{"dataType":"refObject","ref":"Product"}},{"dataType":"enum","enums":[null]}]},
            "parent": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}]},
            "children": {"dataType":"union","subSchemas":[{"dataType":"array","array":{"dataType":"string"}},{"dataType":"enum","enums":[null]}]},
            "isActive": {"dataType":"boolean"},
            "order": {"dataType":"double"},
            "image": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}]},
            "imageAlt": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}]},
            "seoTitle": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}]},
            "seoDescription": {"dataType":"union","subSchemas":[{"dataType":"string"},{"dataType":"enum","enums":[null]}]},
            "seoKeywords": {"dataType":"union","subSchemas":[{"dataType":"array","array":{"dataType":"string"}},{"dataType":"enum","enums":[null]}]},
        },
        "additionalProperties": true,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ContinentSortKey": {
        "dataType": "refAlias",
        "type": {"dataType":"union","subSchemas":[{"dataType":"enum","enums":["name"]},{"dataType":"enum","enums":["slug"]},{"dataType":"enum","enums":["createdAt"]},{"dataType":"enum","enums":["order"]},{"dataType":"enum","enums":["isActive"]}],"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "SuccessResponse__token-string__": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"pagination":{"dataType":"nestedObjectLiteral","nestedProperties":{"pages":{"dataType":"double","required":true},"total":{"dataType":"double","required":true},"limit":{"dataType":"double","required":true},"page":{"dataType":"double","required":true}}},"timestamp":{"dataType":"string","required":true},"data":{"dataType":"nestedObjectLiteral","nestedProperties":{"token":{"dataType":"string","required":true}}},"message":{"dataType":"string"},"success":{"dataType":"enum","enums":[true],"required":true}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ApiResponse__token-string__": {
        "dataType": "refAlias",
        "type": {"dataType":"union","subSchemas":[{"ref":"SuccessResponse__token-string__"},{"ref":"ErrorResponse"}],"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "SuccessResponse_Omit_User.password__": {
        "dataType": "refAlias",
        "type": {"dataType":"nestedObjectLiteral","nestedProperties":{"pagination":{"dataType":"nestedObjectLiteral","nestedProperties":{"pages":{"dataType":"double","required":true},"total":{"dataType":"double","required":true},"limit":{"dataType":"double","required":true},"page":{"dataType":"double","required":true}}},"timestamp":{"dataType":"string","required":true},"data":{"ref":"Omit_User.password_"},"message":{"dataType":"string"},"success":{"dataType":"enum","enums":[true],"required":true}},"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "ApiResponse_Omit_User.password__": {
        "dataType": "refAlias",
        "type": {"dataType":"union","subSchemas":[{"ref":"SuccessResponse_Omit_User.password__"},{"ref":"ErrorResponse"}],"validators":{}},
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
    "LoginModel": {
        "dataType": "refObject",
        "properties": {
            "userName": {"dataType":"string","required":true},
            "userEmail": {"dataType":"string","required":true},
            "password": {"dataType":"string","required":true},
            "rememberMe": {"dataType":"boolean","required":true},
        },
        "additionalProperties": true,
    },
    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
};
const templateService = new ExpressTemplateService(models, {"noImplicitAdditionalProperties":"ignore","bodyCoercion":true});

// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa




export function RegisterRoutes(app: Router,opts?:{multer?:ReturnType<typeof multer>}) {

    // ###########################################################################################################
    //  NOTE: If you do not see routes for all of your controllers in this file, then you might not have informed tsoa of where to look
    //      Please look into the "controllerPathGlobs" config option described in the readme: https://github.com/lukeautry/tsoa
    // ###########################################################################################################

    const upload = opts?.multer ||  multer({"limits":{"fileSize":8388608}});

    
        const argsEmailTemplateController_createTemplate: Record<string, TsoaRoute.ParameterSchema> = {
                body: {"in":"body","name":"body","required":true,"ref":"EmailTemplateDoc"},
        };
        app.post('/api/v1/email-templates',
            ...(fetchMiddlewares<RequestHandler>(EmailTemplateController)),
            ...(fetchMiddlewares<RequestHandler>(EmailTemplateController.prototype.createTemplate)),

            async function EmailTemplateController_createTemplate(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsEmailTemplateController_createTemplate, request, response });

                const controller = new EmailTemplateController();

              await templateService.apiHandler({
                methodName: 'createTemplate',
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
        const argsEmailTemplateController_getTemplates: Record<string, TsoaRoute.ParameterSchema> = {
        };
        app.get('/api/v1/email-templates',
            ...(fetchMiddlewares<RequestHandler>(EmailTemplateController)),
            ...(fetchMiddlewares<RequestHandler>(EmailTemplateController.prototype.getTemplates)),

            async function EmailTemplateController_getTemplates(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsEmailTemplateController_getTemplates, request, response });

                const controller = new EmailTemplateController();

              await templateService.apiHandler({
                methodName: 'getTemplates',
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
        const argsEmailTemplateController_sendEmail: Record<string, TsoaRoute.ParameterSchema> = {
                id: {"in":"path","name":"id","required":true,"dataType":"string"},
                params: {"in":"body","name":"params","required":true,"ref":"Partial_EmailTemplateDoc_"},
        };
        app.post('/api/v1/email-templates/send-email-template/:id',
            ...(fetchMiddlewares<RequestHandler>(EmailTemplateController)),
            ...(fetchMiddlewares<RequestHandler>(EmailTemplateController.prototype.sendEmail)),

            async function EmailTemplateController_sendEmail(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsEmailTemplateController_sendEmail, request, response });

                const controller = new EmailTemplateController();

              await templateService.apiHandler({
                methodName: 'sendEmail',
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
        const argsEmailTemplateController_updateTemplate: Record<string, TsoaRoute.ParameterSchema> = {
                id: {"in":"path","name":"id","required":true,"dataType":"string"},
                body: {"in":"body","name":"body","required":true,"ref":"Partial_EmailTemplateDoc_"},
        };
        app.put('/api/v1/email-templates/:id',
            ...(fetchMiddlewares<RequestHandler>(EmailTemplateController)),
            ...(fetchMiddlewares<RequestHandler>(EmailTemplateController.prototype.updateTemplate)),

            async function EmailTemplateController_updateTemplate(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsEmailTemplateController_updateTemplate, request, response });

                const controller = new EmailTemplateController();

              await templateService.apiHandler({
                methodName: 'updateTemplate',
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
        const argsEmailTemplateController_deleteTemplate: Record<string, TsoaRoute.ParameterSchema> = {
                id: {"in":"path","name":"id","required":true,"dataType":"string"},
        };
        app.delete('/api/v1/email-templates/:id',
            ...(fetchMiddlewares<RequestHandler>(EmailTemplateController)),
            ...(fetchMiddlewares<RequestHandler>(EmailTemplateController.prototype.deleteTemplate)),

            async function EmailTemplateController_deleteTemplate(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsEmailTemplateController_deleteTemplate, request, response });

                const controller = new EmailTemplateController();

              await templateService.apiHandler({
                methodName: 'deleteTemplate',
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
        const argsUserController_getAllUsers: Record<string, TsoaRoute.ParameterSchema> = {
                filtersJson: {"in":"query","name":"filters","dataType":"string"},
                limit: {"default":20,"in":"query","name":"limit","dataType":"double"},
                skip: {"default":0,"in":"query","name":"skip","dataType":"double"},
                sortBy: {"default":"name","in":"query","name":"sortBy","ref":"UserSortKey"},
                sortOrder: {"default":"asc","in":"query","name":"sortOrder","dataType":"union","subSchemas":[{"dataType":"enum","enums":["asc"]},{"dataType":"enum","enums":["desc"]}]},
        };
        app.get('/api/v1/users',
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
        const argsUserController_createUser: Record<string, TsoaRoute.ParameterSchema> = {
                userData: {"in":"body","name":"userData","required":true,"ref":"CreateUserRequest"},
        };
        app.post('/api/v1/users',
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
                req: {"in":"request","name":"req","required":true,"dataType":"object"},
                id: {"in":"path","name":"id","required":true,"dataType":"string"},
                updateData: {"in":"body","name":"updateData","required":true,"ref":"UpdateUserRequest"},
        };
        app.put('/api/v1/users/:id',
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
        const argsUserController_updateUserProfile: Record<string, TsoaRoute.ParameterSchema> = {
                id: {"in":"path","name":"id","required":true,"dataType":"string"},
                updateData: {"in":"body","name":"updateData","required":true,"ref":"UpdateUserRequest"},
        };
        app.put('/api/v1/users/user-profile/:id',
            ...(fetchMiddlewares<RequestHandler>(UserController)),
            ...(fetchMiddlewares<RequestHandler>(UserController.prototype.updateUserProfile)),

            async function UserController_updateUserProfile(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsUserController_updateUserProfile, request, response });

                const controller = new UserController();

              await templateService.apiHandler({
                methodName: 'updateUserProfile',
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
        const argsUserController_getUserProfile: Record<string, TsoaRoute.ParameterSchema> = {
                id: {"in":"path","name":"id","required":true,"dataType":"string"},
        };
        app.get('/api/v1/users/user-profile/:id',
            ...(fetchMiddlewares<RequestHandler>(UserController)),
            ...(fetchMiddlewares<RequestHandler>(UserController.prototype.getUserProfile)),

            async function UserController_getUserProfile(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsUserController_getUserProfile, request, response });

                const controller = new UserController();

              await templateService.apiHandler({
                methodName: 'getUserProfile',
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
        const argsUserController_uploadPhoto: Record<string, TsoaRoute.ParameterSchema> = {
                id: {"in":"path","name":"id","required":true,"dataType":"string"},
                file: {"in":"formData","name":"file","required":true,"dataType":"file"},
        };
        app.post('/api/v1/users/:id/upload-photo',
            upload.fields([
                {
                    name: "file",
                    maxCount: 1
                }
            ]),
            ...(fetchMiddlewares<RequestHandler>(UserController)),
            ...(fetchMiddlewares<RequestHandler>(UserController.prototype.uploadPhoto)),

            async function UserController_uploadPhoto(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsUserController_uploadPhoto, request, response });

                const controller = new UserController();

              await templateService.apiHandler({
                methodName: 'uploadPhoto',
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
        const argsSitemapController_getSitemap: Record<string, TsoaRoute.ParameterSchema> = {
                res: {"in":"res","name":"200","required":true,"dataType":"string"},
                resError: {"in":"res","name":"500","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"message":{"dataType":"string","required":true}}},
        };
        app.get('/sitemap.xml',
            ...(fetchMiddlewares<RequestHandler>(SitemapController)),
            ...(fetchMiddlewares<RequestHandler>(SitemapController.prototype.getSitemap)),

            async function SitemapController_getSitemap(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsSitemapController_getSitemap, request, response });

                const controller = new SitemapController();

              await templateService.apiHandler({
                methodName: 'getSitemap',
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
        const argsProductController_createProduct: Record<string, TsoaRoute.ParameterSchema> = {
                body: {"in":"body","name":"body","required":true,"ref":"CreateProductRequest"},
        };
        app.post('/api/v1/products',
            ...(fetchMiddlewares<RequestHandler>(ProductController)),
            ...(fetchMiddlewares<RequestHandler>(ProductController.prototype.createProduct)),

            async function ProductController_createProduct(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsProductController_createProduct, request, response });

                const controller = new ProductController();

              await templateService.apiHandler({
                methodName: 'createProduct',
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
        const argsProductController_getAllProducts: Record<string, TsoaRoute.ParameterSchema> = {
                limit: {"default":20,"in":"query","name":"limit","dataType":"double"},
                skip: {"default":0,"in":"query","name":"skip","dataType":"double"},
                sortBy: {"default":"createdAt","in":"query","name":"sortBy","ref":"ProductSortKey"},
                sortOrder: {"default":"desc","in":"query","name":"sortOrder","ref":"SortOrder"},
                name: {"in":"query","name":"name","dataType":"string"},
                importance: {"in":"query","name":"importance","dataType":"union","subSchemas":[{"dataType":"enum","enums":["A"]},{"dataType":"enum","enums":["B"]},{"dataType":"enum","enums":["C"]},{"dataType":"enum","enums":["D"]}]},
                tags: {"in":"query","name":"tags","dataType":"string"},
        };
        app.get('/api/v1/products',
            ...(fetchMiddlewares<RequestHandler>(ProductController)),
            ...(fetchMiddlewares<RequestHandler>(ProductController.prototype.getAllProducts)),

            async function ProductController_getAllProducts(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsProductController_getAllProducts, request, response });

                const controller = new ProductController();

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
        const argsProductController_getProductById: Record<string, TsoaRoute.ParameterSchema> = {
                id: {"in":"path","name":"id","required":true,"dataType":"string"},
        };
        app.get('/api/v1/products/:id',
            ...(fetchMiddlewares<RequestHandler>(ProductController)),
            ...(fetchMiddlewares<RequestHandler>(ProductController.prototype.getProductById)),

            async function ProductController_getProductById(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsProductController_getProductById, request, response });

                const controller = new ProductController();

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
        const argsProductController_getProductsByParent: Record<string, TsoaRoute.ParameterSchema> = {
                parentId: {"in":"path","name":"parentId","required":true,"dataType":"string"},
        };
        app.get('/api/v1/products/by-parent/:parentId',
            ...(fetchMiddlewares<RequestHandler>(ProductController)),
            ...(fetchMiddlewares<RequestHandler>(ProductController.prototype.getProductsByParent)),

            async function ProductController_getProductsByParent(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsProductController_getProductsByParent, request, response });

                const controller = new ProductController();

              await templateService.apiHandler({
                methodName: 'getProductsByParent',
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
        const argsProductController_updateProduct: Record<string, TsoaRoute.ParameterSchema> = {
                id: {"in":"path","name":"id","required":true,"dataType":"string"},
                body: {"in":"body","name":"body","required":true,"ref":"UpdateProductRequest"},
        };
        app.put('/api/v1/products/:id',
            ...(fetchMiddlewares<RequestHandler>(ProductController)),
            ...(fetchMiddlewares<RequestHandler>(ProductController.prototype.updateProduct)),

            async function ProductController_updateProduct(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsProductController_updateProduct, request, response });

                const controller = new ProductController();

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
        const argsProductController_deleteProduct: Record<string, TsoaRoute.ParameterSchema> = {
                id: {"in":"path","name":"id","required":true,"dataType":"string"},
        };
        app.delete('/api/v1/products/:id',
            ...(fetchMiddlewares<RequestHandler>(ProductController)),
            ...(fetchMiddlewares<RequestHandler>(ProductController.prototype.deleteProduct)),

            async function ProductController_deleteProduct(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsProductController_deleteProduct, request, response });

                const controller = new ProductController();

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
        app.post('/api/v1/otp/send-email',
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
        app.post('/api/v1/otp/send-mobile',
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
        app.post('/api/v1/otp/check-email',
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
        app.post('/api/v1/otp/check-mobile',
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
        const argsNewsletterController_createSubscriber: Record<string, TsoaRoute.ParameterSchema> = {
                body: {"in":"body","name":"body","required":true,"ref":"Pick_NewsletterSubscriber.email-or-active_"},
        };
        app.post('/api/v1/newsletter',
            ...(fetchMiddlewares<RequestHandler>(NewsletterController)),
            ...(fetchMiddlewares<RequestHandler>(NewsletterController.prototype.createSubscriber)),

            async function NewsletterController_createSubscriber(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsNewsletterController_createSubscriber, request, response });

                const controller = new NewsletterController();

              await templateService.apiHandler({
                methodName: 'createSubscriber',
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
        const argsNewsletterController_getSubscribers: Record<string, TsoaRoute.ParameterSchema> = {
                limit: {"default":10,"in":"query","name":"limit","dataType":"double"},
                skip: {"default":0,"in":"query","name":"skip","dataType":"double"},
                sortBy: {"in":"query","name":"sortBy","dataType":"enum","enums":["createdAt","updatedAt","email","_id","active"]},
                sortOrder: {"in":"query","name":"sortOrder","dataType":"union","subSchemas":[{"dataType":"enum","enums":["asc"]},{"dataType":"enum","enums":["desc"]}]},
                filters: {"in":"query","name":"filters","dataType":"string"},
        };
        app.get('/api/v1/newsletter',
            ...(fetchMiddlewares<RequestHandler>(NewsletterController)),
            ...(fetchMiddlewares<RequestHandler>(NewsletterController.prototype.getSubscribers)),

            async function NewsletterController_getSubscribers(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsNewsletterController_getSubscribers, request, response });

                const controller = new NewsletterController();

              await templateService.apiHandler({
                methodName: 'getSubscribers',
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
        const argsNewsletterController_getSubscriber: Record<string, TsoaRoute.ParameterSchema> = {
                id: {"in":"path","name":"id","required":true,"dataType":"string"},
        };
        app.get('/api/v1/newsletter/:id',
            ...(fetchMiddlewares<RequestHandler>(NewsletterController)),
            ...(fetchMiddlewares<RequestHandler>(NewsletterController.prototype.getSubscriber)),

            async function NewsletterController_getSubscriber(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsNewsletterController_getSubscriber, request, response });

                const controller = new NewsletterController();

              await templateService.apiHandler({
                methodName: 'getSubscriber',
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
        const argsNewsletterController_getSubscriberByEmail: Record<string, TsoaRoute.ParameterSchema> = {
                email: {"in":"path","name":"email","required":true,"dataType":"string"},
        };
        app.get('/api/v1/newsletter/email/:email',
            ...(fetchMiddlewares<RequestHandler>(NewsletterController)),
            ...(fetchMiddlewares<RequestHandler>(NewsletterController.prototype.getSubscriberByEmail)),

            async function NewsletterController_getSubscriberByEmail(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsNewsletterController_getSubscriberByEmail, request, response });

                const controller = new NewsletterController();

              await templateService.apiHandler({
                methodName: 'getSubscriberByEmail',
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
        const argsNewsletterController_upsertSubscriber: Record<string, TsoaRoute.ParameterSchema> = {
                email: {"in":"path","name":"email","required":true,"dataType":"string"},
                body: {"in":"body","name":"body","required":true,"ref":"Partial_NewsletterSubscriber_"},
        };
        app.put('/api/v1/newsletter/:email',
            ...(fetchMiddlewares<RequestHandler>(NewsletterController)),
            ...(fetchMiddlewares<RequestHandler>(NewsletterController.prototype.upsertSubscriber)),

            async function NewsletterController_upsertSubscriber(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsNewsletterController_upsertSubscriber, request, response });

                const controller = new NewsletterController();

              await templateService.apiHandler({
                methodName: 'upsertSubscriber',
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
        const argsNewsletterController_unSubscribe: Record<string, TsoaRoute.ParameterSchema> = {
                id: {"in":"path","name":"id","required":true,"dataType":"string"},
        };
        app.get('/api/v1/newsletter/unsubscribe/:id',
            ...(fetchMiddlewares<RequestHandler>(NewsletterController)),
            ...(fetchMiddlewares<RequestHandler>(NewsletterController.prototype.unSubscribe)),

            async function NewsletterController_unSubscribe(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsNewsletterController_unSubscribe, request, response });

                const controller = new NewsletterController();

              await templateService.apiHandler({
                methodName: 'unSubscribe',
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
        const argsLogController_getUserProfile: Record<string, TsoaRoute.ParameterSchema> = {
                id: {"in":"path","name":"id","required":true,"dataType":"string"},
        };
        app.get('/api/v1/logs/:id',
            ...(fetchMiddlewares<RequestHandler>(LogController)),
            ...(fetchMiddlewares<RequestHandler>(LogController.prototype.getUserProfile)),

            async function LogController_getUserProfile(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsLogController_getUserProfile, request, response });

                const controller = new LogController();

              await templateService.apiHandler({
                methodName: 'getUserProfile',
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
        const argsFileController_uploadFile: Record<string, TsoaRoute.ParameterSchema> = {
                file: {"in":"formData","name":"file","required":true,"dataType":"file"},
        };
        app.post('/api/v1/files',
            upload.fields([
                {
                    name: "file",
                    maxCount: 1
                }
            ]),
            ...(fetchMiddlewares<RequestHandler>(FileController)),
            ...(fetchMiddlewares<RequestHandler>(FileController.prototype.uploadFile)),

            async function FileController_uploadFile(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsFileController_uploadFile, request, response });

                const controller = new FileController();

              await templateService.apiHandler({
                methodName: 'uploadFile',
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
        const argsFileController_getFiles: Record<string, TsoaRoute.ParameterSchema> = {
                limit: {"default":10,"in":"query","name":"limit","dataType":"double"},
                skip: {"default":0,"in":"query","name":"skip","dataType":"double"},
                sortBy: {"in":"query","name":"sortBy","dataType":"enum","enums":["createdAt","filename","mimetype","extension","path","size"]},
                sortOrder: {"in":"query","name":"sortOrder","dataType":"union","subSchemas":[{"dataType":"enum","enums":["asc"]},{"dataType":"enum","enums":["desc"]}]},
                filters: {"in":"query","name":"filters","dataType":"string"},
        };
        app.get('/api/v1/files',
            ...(fetchMiddlewares<RequestHandler>(FileController)),
            ...(fetchMiddlewares<RequestHandler>(FileController.prototype.getFiles)),

            async function FileController_getFiles(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsFileController_getFiles, request, response });

                const controller = new FileController();

              await templateService.apiHandler({
                methodName: 'getFiles',
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
        const argsFileController_deleteFile: Record<string, TsoaRoute.ParameterSchema> = {
                id: {"in":"path","name":"id","required":true,"dataType":"string"},
        };
        app.delete('/api/v1/files/:id',
            ...(fetchMiddlewares<RequestHandler>(FileController)),
            ...(fetchMiddlewares<RequestHandler>(FileController.prototype.deleteFile)),

            async function FileController_deleteFile(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsFileController_deleteFile, request, response });

                const controller = new FileController();

              await templateService.apiHandler({
                methodName: 'deleteFile',
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
        const argsContinentController_createContinent: Record<string, TsoaRoute.ParameterSchema> = {
                body: {"in":"body","name":"body","required":true,"ref":"CreateContinentRequest"},
        };
        app.post('/api/v1/continents',
            ...(fetchMiddlewares<RequestHandler>(ContinentController)),
            ...(fetchMiddlewares<RequestHandler>(ContinentController.prototype.createContinent)),

            async function ContinentController_createContinent(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsContinentController_createContinent, request, response });

                const controller = new ContinentController();

              await templateService.apiHandler({
                methodName: 'createContinent',
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
        const argsContinentController_updateContinent: Record<string, TsoaRoute.ParameterSchema> = {
                body: {"in":"body","name":"body","required":true,"ref":"CreateContinentRequest"},
        };
        app.post('/api/v1/continents/update',
            ...(fetchMiddlewares<RequestHandler>(ContinentController)),
            ...(fetchMiddlewares<RequestHandler>(ContinentController.prototype.updateContinent)),

            async function ContinentController_updateContinent(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsContinentController_updateContinent, request, response });

                const controller = new ContinentController();

              await templateService.apiHandler({
                methodName: 'updateContinent',
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
        const argsContinentController_getAllCategories: Record<string, TsoaRoute.ParameterSchema> = {
                filtersJson: {"in":"query","name":"filters","dataType":"string"},
                limit: {"default":20,"in":"query","name":"limit","dataType":"double"},
                skip: {"default":0,"in":"query","name":"skip","dataType":"double"},
                sortBy: {"default":"name","in":"query","name":"sortBy","ref":"ContinentSortKey"},
                sortOrder: {"default":"asc","in":"query","name":"sortOrder","dataType":"union","subSchemas":[{"dataType":"enum","enums":["asc"]},{"dataType":"enum","enums":["desc"]}]},
        };
        app.get('/api/v1/continents',
            ...(fetchMiddlewares<RequestHandler>(ContinentController)),
            ...(fetchMiddlewares<RequestHandler>(ContinentController.prototype.getAllCategories)),

            async function ContinentController_getAllCategories(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsContinentController_getAllCategories, request, response });

                const controller = new ContinentController();

              await templateService.apiHandler({
                methodName: 'getAllCategories',
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
        const argsContinentController_deleteContinent: Record<string, TsoaRoute.ParameterSchema> = {
                id: {"in":"path","name":"id","required":true,"dataType":"string"},
        };
        app.delete('/api/v1/continents/:id',
            ...(fetchMiddlewares<RequestHandler>(ContinentController)),
            ...(fetchMiddlewares<RequestHandler>(ContinentController.prototype.deleteContinent)),

            async function ContinentController_deleteContinent(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsContinentController_deleteContinent, request, response });

                const controller = new ContinentController();

              await templateService.apiHandler({
                methodName: 'deleteContinent',
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
        const argsClientController_getLargeJson: Record<string, TsoaRoute.ParameterSchema> = {
        };
        app.get('/api/v1/client',
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
        const argsClientController_updateJsonById: Record<string, TsoaRoute.ParameterSchema> = {
                id: {"in":"path","name":"id","required":true,"dataType":"string"},
                updatedJson: {"in":"body","name":"updatedJson","required":true,"dataType":"any"},
        };
        app.put('/api/v1/client/:id',
            ...(fetchMiddlewares<RequestHandler>(ClientController)),
            ...(fetchMiddlewares<RequestHandler>(ClientController.prototype.updateJsonById)),

            async function ClientController_updateJsonById(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsClientController_updateJsonById, request, response });

                const controller = new ClientController();

              await templateService.apiHandler({
                methodName: 'updateJsonById',
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
        app.get('/api/v1/auth/google/url',
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
        app.get('/api/v1/auth/google/callback',
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
        app.get('/api/v1/auth/facebook/url',
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
        app.get('/api/v1/auth/facebook/callback',
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
        app.get('/api/v1/auth/profile',
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
        app.get('/api/v1/auth/verify-token',
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
        const argsAuthController_refreshToken: Record<string, TsoaRoute.ParameterSchema> = {
                req: {"in":"request","name":"req","required":true,"dataType":"object"},
        };
        app.post('/api/v1/auth/refresh-token',
            ...(fetchMiddlewares<RequestHandler>(AuthController)),
            ...(fetchMiddlewares<RequestHandler>(AuthController.prototype.refreshToken)),

            async function AuthController_refreshToken(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsAuthController_refreshToken, request, response });

                const controller = new AuthController();

              await templateService.apiHandler({
                methodName: 'refreshToken',
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
        const argsAuthController_loginUser: Record<string, TsoaRoute.ParameterSchema> = {
                userData: {"in":"body","name":"userData","required":true,"ref":"LoginModel"},
                req: {"in":"request","name":"req","required":true,"dataType":"object"},
        };
        app.post('/api/v1/auth/login',
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
        app.post('/api/v1/auth/logout',
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
        const argsAuthController_resetPassword: Record<string, TsoaRoute.ParameterSchema> = {
                body: {"in":"body","name":"body","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"email":{"dataType":"string","required":true}}},
        };
        app.post('/api/v1/auth/forgot-password',
            ...(fetchMiddlewares<RequestHandler>(AuthController)),
            ...(fetchMiddlewares<RequestHandler>(AuthController.prototype.resetPassword)),

            async function AuthController_resetPassword(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsAuthController_resetPassword, request, response });

                const controller = new AuthController();

              await templateService.apiHandler({
                methodName: 'resetPassword',
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
        const argsAuthController_verifyResetToken: Record<string, TsoaRoute.ParameterSchema> = {
                token: {"in":"query","name":"token","required":true,"dataType":"string"},
        };
        app.get('/api/v1/auth/verify-reset-token',
            ...(fetchMiddlewares<RequestHandler>(AuthController)),
            ...(fetchMiddlewares<RequestHandler>(AuthController.prototype.verifyResetToken)),

            async function AuthController_verifyResetToken(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsAuthController_verifyResetToken, request, response });

                const controller = new AuthController();

              await templateService.apiHandler({
                methodName: 'verifyResetToken',
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
        const argsAuthController_setNewPassword: Record<string, TsoaRoute.ParameterSchema> = {
                body: {"in":"body","name":"body","required":true,"dataType":"nestedObjectLiteral","nestedProperties":{"newPassword":{"dataType":"string","required":true},"token":{"dataType":"string","required":true}}},
        };
        app.post('/api/v1/auth/reset-password',
            ...(fetchMiddlewares<RequestHandler>(AuthController)),
            ...(fetchMiddlewares<RequestHandler>(AuthController.prototype.setNewPassword)),

            async function AuthController_setNewPassword(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsAuthController_setNewPassword, request, response });

                const controller = new AuthController();

              await templateService.apiHandler({
                methodName: 'setNewPassword',
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
        const argsAuthController_verifyUnsubscribeResetToken: Record<string, TsoaRoute.ParameterSchema> = {
                token: {"in":"query","name":"token","required":true,"dataType":"string"},
        };
        app.get('/api/v1/auth/verify-unsubscribe-token',
            ...(fetchMiddlewares<RequestHandler>(AuthController)),
            ...(fetchMiddlewares<RequestHandler>(AuthController.prototype.verifyUnsubscribeResetToken)),

            async function AuthController_verifyUnsubscribeResetToken(request: ExRequest, response: ExResponse, next: any) {

            // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa

            let validatedArgs: any[] = [];
            try {
                validatedArgs = templateService.getValidatedArgs({ args: argsAuthController_verifyUnsubscribeResetToken, request, response });

                const controller = new AuthController();

              await templateService.apiHandler({
                methodName: 'verifyUnsubscribeResetToken',
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

    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa


    // WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
}

// WARNING: This file was auto-generated with tsoa. Please do not modify it. Re-run tsoa to re-generate this file: https://github.com/lukeautry/tsoa
