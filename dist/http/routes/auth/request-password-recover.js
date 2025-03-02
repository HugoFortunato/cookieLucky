"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requestPasswordRecover = requestPasswordRecover;
const zod_1 = require("zod");
const prisma_1 = require("../../../lib/prisma");
async function requestPasswordRecover(app) {
    app.withTypeProvider().post('/password/recover', {
        schema: {
            tags: ['Auth'],
            summary: 'Get authenticated user profile',
            body: zod_1.z.object({
                email: zod_1.z.string().email(),
            }),
            response: {
                201: zod_1.z.object({
                    code: zod_1.z.string(),
                }),
            },
        },
    }, async (request, reply) => {
        const { email } = request.body;
        const userFromEmail = await prisma_1.prisma.user.findUnique({
            where: { email },
        });
        if (!userFromEmail) {
            return reply.status(201).send();
        }
        const { id: code } = await prisma_1.prisma.token.create({
            data: {
                type: 'PASSWORD_RECOVER',
                userId: userFromEmail.id,
            },
        });
        return reply.status(201).send({ code });
    });
}
