import React, { useEffect, useState, useCallback } from "react";
import { GenericDataGrid, Column, PaginationModel, SortModel, FilterModel } from "../../GenericDataGrid/GenericDataGrid"; // import your generic grid
import axiosInstance from "../../../api/axiosInstance";
import { NewsletterSubscriber } from '../../../../../src/types/newsletterSubscriber.types';
import Loader from "@/Components/Loader/Loader";
import { useToast } from "../../../Providers/ToastContext";
import { FaCheck, FaTimes } from "react-icons/fa";


export const NewsletterSubscribers = () => {
    const { show } = useToast();
    
    const columns: Column<NewsletterSubscriber>[] = [
        {
            field: "_id",
            headerName: "ID",
            width: '10%',
        },
        {
            field: "active",
            headerName: "Active",
            width: '5%',
            sortable: true,
            // filterable: true,
            renderCell: (params) => (
                <div style={{ display: "flex", alignItems: "center" }}>
                    {params.active ? (
                        <FaCheck style={{ color: "green", fontSize: "18px" }} />
                    ) : (
                        <FaTimes style={{ color: "red", fontSize: "18px" }} />
                    )}
                </div>
            ),
        }
        ,
        {
            field: "email",
            headerName: "email",
            sortable: true,
            filterable: true,
            width: '10%',
        },


        {
            field: "createdAt",
            headerName: "Created At",
            sortable: true,
            width: '10%',
            renderCell: (row) =>
                row.createdAt ? new Date(row.createdAt).toLocaleDateString() : "—",
        },
        {
            field: "updatedAt",
            headerName: "Updated At",
            sortable: true,
            width: '10%',
            renderCell: (row) =>
                row.createdAt ? new Date(row.createdAt).toLocaleDateString() : "—",
        },


    ];

    const [rows, setRows] = useState<NewsletterSubscriber[]>([]);
    const [rowCount, setRowCount] = useState(0);
    const [paginationModel, setPaginationModel] = useState<PaginationModel>({
        page: 1,
        pageSize: 10,
    });
    const [sortModel, setSortModel] = useState<SortModel<NewsletterSubscriber> | null>(null);
    const [filterModel, setFilterModel] = useState<FilterModel<NewsletterSubscriber>[] | null>(
        null
    );
    const [loading, setLoading] = useState(false);

    const fetchNewsletterSubscribers = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();

            // Map pagination: limit & skip
            params.append("limit", paginationModel.pageSize.toString());
            params.append("skip", ((paginationModel.page - 1) * paginationModel.pageSize).toString());

            // Map sort
            if (sortModel) {
                params.append("sortBy", String(sortModel.field));
                params.append("sortOrder", sortModel.sort);
            }

            // Add filter
            if (filterModel && filterModel.length > 0) {
                params.append("filters", JSON.stringify(filterModel));
            }

            const response = await axiosInstance.get("/newsletter", { params });

            setRows(response.data.data.subscribers);
            setRowCount(response.data.data.total);
        } catch (err) {
            console.error("Failed to fetch user profiles", err);
        } finally {
            setLoading(false);
        }
    }, [paginationModel, sortModel, filterModel]);

    useEffect(() => {
        fetchNewsletterSubscribers();
    }, [fetchNewsletterSubscribers]);



    return (
        <>
            <h3 className="mb">Newsletter Subscribers</h3>
              {loading ?
                <Loader/>

             : 
            <GenericDataGrid<NewsletterSubscriber>
                rows={rows}
                prevButtonClassName="dashboard-btn--ghost-minimal"
                nextButtonClassName="dashboard-btn--ghost-minimal"
                columns={columns}
                rowCount={rowCount}
                paginationModel={paginationModel}
                onPaginationModelChange={setPaginationModel}
                sortModel={sortModel}
                onSortModelChange={setSortModel}
                filterModel={filterModel}
                onFilterModelChange={setFilterModel}
                getRowId={(row) => row._id!.toString()}
            />
             }
        </>
    );
};
