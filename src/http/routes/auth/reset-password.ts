import { z } from 'zod';
import { hash } from 'bcryptjs';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';

import { prisma } from '../../../lib/prisma';
import { UnauthorizedError } from '../_errors/unauthorized-error';

export async function resetPassword(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().post(
    '/password/reset',
    {
      schema: {
        tags: ['Auth'],
        summary: 'Get authenticated user profile',
        body: z.object({
          code: z.string(),
          password: z.string().min(6),
        }),
        response: {
          200: z.object({
            message: z.string(),
          }),
        },
      },
    },

    async (request, reply) => {
      const { code, password } = request.body;

      const tokenFromCode = await prisma.token.findUnique({
        where: { id: code },
      });

      if (!tokenFromCode) {
        throw new UnauthorizedError();
      }

      const passwordHash = await hash(password, 6);

      await prisma.$transaction([
        prisma.user.update({
          where: {
            id: tokenFromCode.userId,
          },
          data: {
            passwordHash,
          },
        }),

        prisma.token.delete({
          where: {
            id: tokenFromCode.id,
          },
        }),
      ]);

      await prisma.user.update({
        where: {
          id: tokenFromCode.userId,
        },
        data: {
          passwordHash,
        },
      });
      return reply.status(200).send({
        message: 'Password successfully updated',
      });
    }
  );
}
