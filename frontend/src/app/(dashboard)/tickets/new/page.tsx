import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { TicketForm } from "@/components/tickets/TicketForm";

const NewTicketPage = async () => {
  const session = await getSession();

  if (!session || session.role !== "support_manager") {
    redirect("/tickets");
  }

  return <TicketForm />;
};

export default NewTicketPage;
