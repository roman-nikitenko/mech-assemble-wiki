-- CreateTable
CREATE TABLE "build_hearts" (
    "build_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,

    CONSTRAINT "build_hearts_pkey" PRIMARY KEY ("build_id","user_id")
);

-- AddForeignKey
ALTER TABLE "build_hearts" ADD CONSTRAINT "build_hearts_build_id_fkey" FOREIGN KEY ("build_id") REFERENCES "builds"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "build_hearts" ADD CONSTRAINT "build_hearts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
