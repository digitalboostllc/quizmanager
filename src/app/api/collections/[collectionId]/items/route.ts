import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { NextResponse } from "next/server"

export async function GET(
    req: Request,
    { params }: { params: { collectionId: string } }
) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return new NextResponse("Unauthorized", { status: 401 })
        }

        const collection = await prisma.collection.findUnique({
            where: {
                id: params.collectionId,
                userId: session.user.id,
            },
            include: {
                items: {
                    include: {
                        content: true,
                    },
                    orderBy: {
                        createdAt: "desc",
                    },
                },
            },
        })

        if (!collection) {
            return new NextResponse("Collection not found", { status: 404 })
        }

        return NextResponse.json(collection)
    } catch (error) {
        console.error("[COLLECTION_ITEMS_GET]", error)
        return new NextResponse("Internal Error", { status: 500 })
    }
}

export async function POST(
    req: Request,
    { params }: { params: { collectionId: string } }
) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return new NextResponse("Unauthorized", { status: 401 })
        }

        const body = await req.json()
        const { contentId } = body

        if (!contentId) {
            return new NextResponse("Content ID is required", { status: 400 })
        }

        // Verify collection exists and belongs to user
        const collection = await prisma.collection.findUnique({
            where: {
                id: params.collectionId,
                userId: session.user.id,
            },
        })

        if (!collection) {
            return new NextResponse("Collection not found", { status: 404 })
        }

        // Verify content exists and belongs to user
        const content = await prisma.contentUsage.findUnique({
            where: {
                id: contentId,
                userId: session.user.id,
            },
        })

        if (!content) {
            return new NextResponse("Content not found", { status: 404 })
        }

        // Check if item already exists in collection
        const existingItem = await prisma.collectionItem.findFirst({
            where: {
                collectionId: params.collectionId,
                contentId: contentId,
            },
        })

        if (existingItem) {
            return new NextResponse("Item already exists in collection", { status: 400 })
        }

        const collectionItem = await prisma.collectionItem.create({
            data: {
                collectionId: params.collectionId,
                contentId: contentId,
            },
            include: {
                content: true,
            },
        })

        return NextResponse.json(collectionItem)
    } catch (error) {
        console.error("[COLLECTION_ITEMS_POST]", error)
        return new NextResponse("Internal Error", { status: 500 })
    }
}

export async function DELETE(
    req: Request,
    { params }: { params: { collectionId: string } }
) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return new NextResponse("Unauthorized", { status: 401 })
        }

        const { searchParams } = new URL(req.url)
        const contentId = searchParams.get("contentId")

        if (!contentId) {
            return new NextResponse("Content ID is required", { status: 400 })
        }

        // Verify collection exists and belongs to user
        const collection = await prisma.collection.findUnique({
            where: {
                id: params.collectionId,
                userId: session.user.id,
            },
        })

        if (!collection) {
            return new NextResponse("Collection not found", { status: 404 })
        }

        // Delete the collection item
        await prisma.collectionItem.deleteMany({
            where: {
                collectionId: params.collectionId,
                contentId: contentId,
            },
        })

        return new NextResponse(null, { status: 204 })
    } catch (error) {
        console.error("[COLLECTION_ITEMS_DELETE]", error)
        return new NextResponse("Internal Error", { status: 500 })
    }
} 