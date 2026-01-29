import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class RegionsService {
    constructor(private readonly prisma: PrismaService) { }

    async findAll() {
        return this.prisma.region.findMany({
            select: {
                id: true,
                name: true,
            },
            orderBy: { name: 'asc' },
        });
    }
}
