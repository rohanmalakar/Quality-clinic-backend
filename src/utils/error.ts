// type RequestError = {
//     code: number,
//     message: string,
// }

import { INVALID } from "zod"

export class RequestError {
    code: number
    message: string
    statusCode: number
    constructor(message: string, code: number, statusCode: number) {
        this.statusCode = statusCode
        this.message = message
        this.code = code
    }
}

/*
error code stating with 1 is common across all services
error code starting with 2 is for user service flow
error code starting with 3 is for service service flow
error code starting with 4 is for doctor service flow
error code starting with 5 is for booking service flow
error code starting with 6 is for redeem service flow



200 OK - Response to a successful GET, PUT, PATCH or DELETE. Can also be used for a POST that doesn't result in a creation.
201 Created - Response to a POST that results in a creation. Should be combined with a Location header pointing to the location of the new resource
204 No Content - Response to a successful request that won't be returning a body (like a DELETE request)
304 Not Modified - Used when HTTP caching headers are in play
400 Bad Request - The request is malformed, such as if the body does not parse
401 Unauthorized - When no or invalid authentication details are provided. Also useful to trigger an auth popup if the API is used from a browser
403 Forbidden - When authentication succeeded but authenticated user doesn't have access to the resource
404 Not Found - When a non-existent resource is requested
405 Method Not Allowed - When an HTTP method is being requested that isn't allowed for the authenticated user
410 Gone - Indicates that the resource at this end point is no longer available. Useful as a blanket response for old API versions
415 Unsupported Media Type - If incorrect content type was provided as part of the request
422 Unprocessable Entity - Used for validation errors
429 Too Many Requests - When a request is rejected due to rate limiting
500 Internal Server Error - This is either a system or application error, and generally indicates that although the client appeared to provide a correct request, something unexpected has gone wrong on the server
503 Service Unavailable - The server is unable to handle the request for a service due to temporary maintenance
*/

export const ERRORS = {
    NOT_FOUND: new RequestError("Resource not found", 10000, 404),
    DATABASE_ERROR: new RequestError("DATABASE ERROR", 10001, 500),
    INVALID_REQUEST_BODY: new RequestError("invalid request body", 10002, 400),
    INVALID_QUERY_PARAMETER: new RequestError("invalid query body", 10003, 400),
    AUTH_NO_TOKEN_FOUND: new RequestError("No token found", 10004, 401),
    AUTH_UNAUTHERISED: new RequestError("UNAUTHERISED", 10005, 401),
    UNHANDLED_ERROR: new RequestError("Some unhandled error occured at server", 10006, 500),
    CONNOT_DETERMINE_TIME: new RequestError("Some unhandled error occured at server", 10007, 500),
    INTERNAL_SERVER_ERROR: new RequestError("Internal server error", 10008, 500),
    ADMIN_ONLY_ROUTE: new RequestError("Only admin is allowed to access this route", 10009, 403),
    FILE_NOT_FOUND: new RequestError("File not found", 10010, 400),
    INVALID_FILE_TYPE: new RequestError("Invalid file type. Only PNG, JPEG and JPG are allowed", 10011, 400),
    INVALID_PARAMS: new RequestError("Invalid params", 10012, 400),

    EMAIL_ALREADY_EXISTS: new RequestError("Email already exists", 20001, 400),
    PHONE_ALREADY_EXISTS: new RequestError("Phone already exists", 20002, 400),
    SERVICE_CART_ITEM_ALREADY_EXISTS: new RequestError("Service cart item already exists", 20003, 400),
    NATIONAL_ID_ALREADY_EXISTS: new RequestError("National ID already exists", 20003, 400),
    INVALID_OTP: new RequestError("Invalid OTP", 20004, 400),
    INVALID_REFRESH_TOKEN: new RequestError("Invalid refresh token", 20006, 400),
    INVALID_AUTH_TOKEN: new RequestError("Invalid auth token", 20005, 400),
    USER_NOT_FOUND: new RequestError("User not found", 20007, 404),
    USER_HAS_BOOKINGS: new RequestError("User has active bookings", 20010, 400),
    INVALID_TIME_SLOT: new RequestError("Invalid time slot", 20008, 400),
    SMS_SENDING_FAILED: new RequestError("SMS sending failed", 20009, 500),


    INVALID_SERVICE_CATEGORY: new RequestError("Invalid service category", 30001, 400),
    SERVICE_NOT_FOUND: new RequestError("Service not found", 30002, 404),
    BRANCH_NOT_FOUND: new RequestError("Branch not found", 30003, 404),
    DOCTOR_NOT_FOUND: new RequestError("Doctor not found", 30004, 404),
    DOCTOR_BRANCH_NOT_FOUND: new RequestError("Doctor branch not found", 30005, 404),
    DOCTOR_TIME_SLOT_NOT_FOUND: new RequestError("Doctor time slot not found", 30006, 404),
    DOCTOR_NOT_ASSIGNED_TO_BRANCH: new RequestError("Doctor not assigned to branch", 30007, 400),
    SERVICE_ALREADY_ADDED_TO_BRANCH: new RequestError("Service already added to branch", 30008, 400),
    SERVICE_TIME_SLOT_NOT_FOUND: new RequestError("Service time slot not found", 30009, 404),
    INVALID_DAY_MAPPING: new RequestError("Invalid day mapping", 30010, 400),

    BOOKING_NOT_FOUND: new RequestError("Booking not found", 50001, 404),
    DOCTOR_ALREADY_BOOKED_FOR_THIS_SLOT: new RequestError("Doctor already booked for this slot", 50002, 400),
    BOOKING_NOT_FOUND_FOR_SERVICE: new RequestError("Booking not found for service", 50003, 404),
    TIME_SLOT_NOT_FOUND_FOR_DOCTOR: new RequestError("Time slot not found for doctor", 50004, 404),
    ALL_SLOTS_ALREADY_BOOKED_FOR_THIS_SERVICE: new RequestError("All slots already booked for this service", 50005, 400),
    DUPLICATE_BOOKING: new RequestError("Duplicate booking found.", 50006, 400),

    INSUFFICIENT_QPOINTS: new RequestError("Insufficient QPoints", 60001, 400),

    REVIEW_NOT_FOUND: new RequestError("Review not found", 50001, 404),
    REVIEW_ALREADY_EXISTS: new RequestError("Review already exists", 50002, 400),

    DUPLICATE_CATEGORY: new RequestError("Duplication data found", 50006, 400),
    DUPLICATE_RECORD: new RequestError("Duplicate Record found", 5006, 400),

}
