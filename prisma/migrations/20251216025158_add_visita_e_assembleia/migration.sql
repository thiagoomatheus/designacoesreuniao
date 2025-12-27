-- CreateTable
CREATE TABLE "visitas" (
    "id" TEXT NOT NULL,
    "semana" TEXT NOT NULL,
    "cong" INTEGER NOT NULL,
    "tema" TEXT NOT NULL,

    CONSTRAINT "visitas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assembleias" (
    "id" TEXT NOT NULL,
    "semana" TEXT NOT NULL,
    "cong" INTEGER NOT NULL,
    "tema" TEXT NOT NULL,

    CONSTRAINT "assembleias_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "visitas" ADD CONSTRAINT "visitas_semana_fkey" FOREIGN KEY ("semana") REFERENCES "semana"("semana") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assembleias" ADD CONSTRAINT "assembleias_semana_fkey" FOREIGN KEY ("semana") REFERENCES "semana"("semana") ON DELETE CASCADE ON UPDATE CASCADE;
