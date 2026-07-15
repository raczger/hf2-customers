import { PrismaClient } from "@prisma/client";

// Egyetlen Prisma kliens az egész folyamatra.
export const prisma = new PrismaClient();
