// @ts-nocheck
"use server";

import {
  IngressAudioEncodingPreset,
  IngressClient,
  IngressInput,
  IngressVideoEncodingPreset,
  TrackSource,
  type CreateIngressOptions,
} from "livekit-server-sdk";

import prisma from "@/db";
import { getSelf } from "./auth-service";
import { revalidatePath } from "next/cache";

const ingressClient = new IngressClient(
  process.env.LIVEKIT_API_URL!,
  process.env.LIVEKIT_API_KEY!,
  process.env.LIVEKIT_API_SECRET!
);


const deleteExistingIngress = async (ingressId?: string | null) => {
  if (!ingressId) return;

  try {
    await ingressClient.deleteIngress(ingressId);
  } catch (err: any) {
    if (err?.status !== 404) {
      throw err;
    }
  }
};

export const createIngress = async (ingressType: IngressInput) => {
  const self = await getSelf();

  const stream = await prisma.stream.findUnique({
    where: { userId: self.id },
  });

  await deleteExistingIngress(stream?.ingressId);

  const options: CreateIngressOptions = {
    name: self.username,
    roomName: self.id,
    participantIdentity: self.id,
    participantName: self.username,
  };

  if (ingressType === IngressInput.WHIP_INPUT) {
    options.bypassTranscoding = true;
  } else {
    options.video = {
      source: TrackSource.CAMERA,
      preset: IngressVideoEncodingPreset.H264_1080P_30FPS_3_LAYERS,
    };
  }

  options.audio = {
    source: TrackSource.MICROPHONE,
    preset: IngressAudioEncodingPreset.OPUS_STEREO_96KBPS,
  };

  let ingress;
  try {
    ingress = await ingressClient.createIngress(ingressType, options);
  } catch (err: any) {
    if (err?.status === 429) {
      throw new Error("Too many requests. Please wait a few seconds and try again.");
    }
    throw err;
  }

  if (!ingress?.url || !ingress?.streamKey || !ingress?.ingressId) {
    throw new Error("Failed to create ingress");
  }

  await prisma.stream.update({
    where: { userId: self.id },
    data: {
      ingressId: ingress.ingressId,
      serverUrl: ingress.url,
      streamKey: ingress.streamKey,
    },
  });

  revalidatePath(`/u/${self.username}/keys`);
};
