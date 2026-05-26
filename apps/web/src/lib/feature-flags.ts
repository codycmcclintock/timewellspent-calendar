/** Link ingest — on by default for MVP; set RUFFLES_LINK_INGEST=false to hide. */
export function isLinkIngestEnabled(): boolean {
  return process.env.RUFFLES_LINK_INGEST !== "false";
}
