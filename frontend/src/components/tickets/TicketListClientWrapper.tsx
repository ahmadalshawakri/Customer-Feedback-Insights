"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/apiClient";
import { TicketFilters } from "./TicketFilters";
import { TicketTable } from "./TicketTable";
import { TicketPagination } from "./TicketPagination";
import type { PaginatedTickets, TicketStatus } from "@/types";

interface TicketListClientWrapperProps {
    initialData: PaginatedTickets;
    filters: {
        page: number;
        status?: TicketStatus;
        is_complex?: boolean;
    };
}

export const TicketListClientWrapper = ({
    initialData,
    filters
}: TicketListClientWrapperProps) => {

    const { data } = useQuery({
        queryKey: ["tickets", filters],
        queryFn: () => api.tickets.list(filters),
        initialData,
        staleTime: 1000 * 60 * 5,
        refetchOnWindowFocus: false,
    });

    return (
        <div className="space-y-6">
            <TicketFilters />
            <TicketTable tickets={data.items} />
            <TicketPagination
                currentPage={data.page}
                totalPages={data.pages}
                totalItems={data.total}
                pageSize={data.page_size}
            />
        </div>
    );
};
