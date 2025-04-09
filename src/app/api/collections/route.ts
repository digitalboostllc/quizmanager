import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { NextResponse } from "next/server"

export async function GET() {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return new NextResponse("Unauthorized", { status: 401 })
        }

        const collections = await prisma.collection.findMany({
            where: {
                userId: session.user.id,
            },
            include: {
                _count: {
                    select: {
                        items: true,
                    },
                },
            },
            orderBy: {
                createdAt: "desc",
            },
        })

        return NextResponse.json(collections)
    } catch (error) {
        console.error("[COLLECTIONS_GET]", error)
        return new NextResponse("Internal Error", { status: 500 })
    }
}

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return new NextResponse("Unauthorized", { status: 401 })
        }

        const body = await req.json()
        const { name, description } = body

        if (!name) {
            return new NextResponse("Name is required", { status: 400 })
        }

        const collection = await prisma.collection.create({
            data: {
                name,
                description,
                userId: session.user.id,
            },
            include: {
                _count: {
                    select: {
                        items: true,
                    },
                },
            },
        })

        return NextResponse.json(collection)
    } catch (error) {
        console.error("[COLLECTIONS_POST]", error)
        return new NextResponse("Internal Error", { status: 500 })
    }
} 