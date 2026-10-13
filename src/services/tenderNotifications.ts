import { UserModel } from "../models/user.model";
import { TenderDocument } from "../models/tender.model";
import { ensureEmailTemplate, TENDER_PUBLISHED_NOTIFICATION } from "./emailTemplateProvisioning";
import { sendDynamicEmailDoc } from "./emailService";
import { escapeHtml } from "../utils/helpers";

const dashboardUrl = (): string => {
  const origin =
    process.env.NODE_ENV === "PRODUCTION"
      ? process.env.CLIENT_ORIGIN_PROD
      : process.env.CLIENT_ORIGIN_DEV;
  return `${origin ?? ""}/dashboard?tab=tenders`;
};

const toOutcome = (result: PromiseSettledResult<unknown>) => ({
  status: result.status === "fulfilled" ? "sent" : "failed",
  error:
    result.status === "rejected"
      ? String((result.reason as any)?.message ?? result.reason).slice(0, 500)
      : null,
});

/**
 * Emails every other member assigned to the tender's sector. Best-effort: one bad
 * address must never block another recipient or the tender-creation response that
 * already completed before this runs (research R3).
 */
export async function notifyTenderPublished(tender: Pick<TenderDocument, "sector" | "publisher" | "announcement" | "deadline" | "creator">): Promise<void> {
  try {
    await ensureEmailTemplate(TENDER_PUBLISHED_NOTIFICATION);

    const filter = {
      industrySectors: tender.sector,
      _id: { $ne: tender.creator.userId },
    };
    //@ts-ignore
    const recipients = await UserModel.find(filter).select("email").lean();

    const dashboardLink = dashboardUrl();
    const variables = {
      SECTOR_NAME: escapeHtml(tender.sector),
      PUBLISHER: escapeHtml(tender.publisher),
      ANNOUNCEMENT: escapeHtml(tender.announcement),
      DEADLINE: new Date(tender.deadline).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }),
      DASHBOARD_URL: dashboardLink,
    };

    const results = await Promise.allSettled(
      recipients
        .filter((recipient: any) => recipient.email)
        .map((recipient: any) =>
          sendDynamicEmailDoc(TENDER_PUBLISHED_NOTIFICATION.name, {
            ...variables,
            email: recipient.email,
          })
        )
    );

    results.forEach((result, index) => {
      const outcome = toOutcome(result);
      if (outcome.status === "failed") {
        console.error(
          `Tender notification failed for ${recipients[index]?.email}:`,
          outcome.error
        );
      }
    });
  } catch (error) {
    // Never let a notification failure affect the tender that already saved successfully.
    console.error("Tender notification fan-out failed:", error);
  }
}
