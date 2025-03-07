"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createAccount = createAccount;
const zod_1 = require("zod");
const bcryptjs_1 = require("bcryptjs");
const prisma_1 = require("../../../lib/prisma");
const bad_request_error_1 = require("../../../http/routes/_errors/bad-request-error");
async function createAccount(app) {
    app.withTypeProvider().post('/users', {
        schema: {
            tags: ['Auth'],
            summary: 'Create a new account',
            body: zod_1.z.object({
                name: zod_1.z.string(),
                email: zod_1.z.string().email(),
                password: zod_1.z.string().min(6),
            }),
        },
    }, async (request, reply) => {
        const { name, email, password } = request.body;
        const userWithSameEmail = await prisma_1.prisma.user.findUnique({
            where: {
                email,
            },
        });
        if (userWithSameEmail) {
            throw new bad_request_error_1.BadRequestError('User with same e-mail already exists.');
        }
        const passwordHash = await (0, bcryptjs_1.hash)(password, 6);
        await prisma_1.prisma.user.create({
            data: {
                name,
                email,
                passwordHash,
            },
        });
        return reply.status(201).send();
    });
}
