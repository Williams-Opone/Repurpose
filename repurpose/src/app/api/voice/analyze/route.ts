import {
  analyzeVoice,
  persistVoiceProfile,
  requireOwnedVoice,
  VoiceIdSchema,
} from "@/features/voice";
import { requireUserId } from "@/lib/auth";
import { ANALYSIS_TIMEOUT_S, MIN_VOICE_SAMPLES } from "@/lib/constants";
import { AppError } from "@/lib/errors";
import { errorResponse } from "@/lib/http";
import { logger } from "@/lib/logger";

export const maxDuration = ANALYSIS_TIMEOUT_S;

export async function POST(req: Request) {
  try {
    const userId = await requireUserId();

    const body = await req.json().catch(() => null);
    const parsed = VoiceIdSchema.safeParse(body);
    if (!parsed.success) throw new AppError("INVALID_INPUT");

    const voice = await requireOwnedVoice(parsed.data.voiceId, userId);
    if (voice.samples.length < MIN_VOICE_SAMPLES) {
      throw new AppError(
        "INVALID_INPUT",
        `Add at least ${MIN_VOICE_SAMPLES} samples before analyzing.`,
      );
    }

    const result = analyzeVoice({
      samples: voice.samples,
      abortSignal: req.signal,
      onFinish: async ({ object, error, totalTokens }) => {
        if (!object) {
          logger.warn("voice analysis returned no valid object", {
            voiceId: voice.id,
            cause: String(error),
          });
          return;
        }
        await persistVoiceProfile(voice.id, object);
        logger.info("voice analyzed", { voiceId: voice.id, userId, totalTokens });
      },
    });

    // Text stream = what `useObject` on the client consumes.
    return result.toTextStreamResponse();
  } catch (e) {
    return errorResponse(e);
  }
}
