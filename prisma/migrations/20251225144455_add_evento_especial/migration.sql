/*
  Warnings:

  - You are about to drop the `assembleias` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "TipoEvento" AS ENUM ('assembleia', 'congresso');

-- DropForeignKey
ALTER TABLE "assembleias" DROP CONSTRAINT "assembleias_semana_fkey";

-- DropTable
DROP TABLE "assembleias";

-- CreateTable
CREATE TABLE "EventoEspecial" (
    "id" TEXT NOT NULL,
    "semana" TEXT NOT NULL,
    "data" TIMESTAMP(3) NOT NULL,
    "cong" INTEGER NOT NULL,
    "tema" TEXT NOT NULL,
    "tipo" "TipoEvento" NOT NULL,

    CONSTRAINT "EventoEspecial_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "EventoEspecial" ADD CONSTRAINT "EventoEspecial_semana_fkey" FOREIGN KEY ("semana") REFERENCES "semana"("semana") ON DELETE CASCADE ON UPDATE CASCADE;
