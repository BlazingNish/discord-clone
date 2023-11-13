import { currentProfile } from "@/lib/current-profile";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { DirectMessage } from "@prisma/client";

const MESSAGE_BATCH = 10;

export async function GET(req: Request) {
    try {
        const profile = currentProfile();
        const { searchParams } = new URL(req.url);

        const cursor = searchParams.get("cursor");
        const conversationId = searchParams.get("conversationId");

        if (!profile) {
            return new NextResponse("unauthorized", { status: 401 });
        }
        if (!conversationId) {
            return new NextResponse("Conversation Id missing", { status: 400 });
        }

        let messages: DirectMessage[] = [];

        if (cursor) {
            messages = await db.directMessage.findMany({
                take: MESSAGE_BATCH,
                skip: 1,
                cursor: {
                    id: cursor,
                },
                where: {
                    conversationId,
                },
                include: {
                    member: {
                        include: {
                            profile: true
                        }
                    }
                },
                orderBy: {
                    createdAt: "desc"
                }
            })
        } else {
            messages = await db.directMessage.findMany({
                take: MESSAGE_BATCH,
                where: {
                    conversationId,
                },
                include: {
                    member: {
                        include: {
                            profile: true,
                        }
                    }
                },
                orderBy: {
                    createdAt: "desc"
                }
            })
        }

        let nextCursor = null;

        if (messages.length === MESSAGE_BATCH) {
            nextCursor = messages[MESSAGE_BATCH - 1].id;
        }

        return NextResponse.json({ item: messages, cursor: nextCursor })
    } catch (error) {
        console.log("[DIRECT_MESSAGES_GET]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}