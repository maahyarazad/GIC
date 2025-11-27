import React, { useEffect, useState, useCallback } from "react";
import { GenericDataGrid, Column, PaginationModel, SortModel, FilterModel } from "../../GenericDataGrid/GenericDataGrid"; // import your generic grid
import axiosInstance from "../../../api/axiosInstance";
import { User } from '../../../../../../src/types/user.types'
import { updateUser, UpdateUserRequest } from '../../../api/user'
import { useToast } from "../../../providers/ToastContext";



export const UserProfilesDataGrid = () => {
  const { show } = useToast();
  const columns: Column<User>[] = [
    {
      field: "_id",
      headerName: "ID",
      width: 180,
    },
    {
      field: "name",
      headerName: "Name",
      sortable: true,
      filterable: true,
      width: 150,
    },
    {
      field: "authorize",
      headerName: "Authorize",
      sortable: true,
      filterable: false,
      width: 150,
    },
    {
      field: "email",
      headerName: "Email",
      sortable: true,
      filterable: true,
      width: 250,
    },
    {
      field: "role",
      headerName: "Role",
      sortable: true,
      filterable: true,
      width: 100,
    },
    {
      field: "avatar",
      headerName: "Avatar",
      renderCell: (row) =>
        row.avatar ? (
          <img
            src={row.avatar}
            alt={row.name}
            style={{ width: 40, height: 40, borderRadius: "50%" }}
          />
        ) : (
          "—"
        ),
      width: 60,
    },
    {
      field: "createdAt",
      headerName: "Created At",
      sortable: true,
      width: 180,
      renderCell: (row) =>
        row.createdAt ? new Date(row.createdAt).toLocaleDateString() : "—",
    },
    {
      headerName: "Actions",
      width: 150,
      renderCell: (row) => (
        <>
          <div className="btn-group" role="group" aria-label="Basic example">
            <button className={`btn btn-sm dashboard-btn`}
              disabled={row.authorize} onClick={() => toggleAuthorization(row)}>Authorize</button>
            <button className={`btn btn-sm dashboard-btn`}
              disabled={!row.authorize} onClick={() => toggleAuthorization(row)}>Unauthorize</button>
          </div>

          <button className="btn btn-sm dashboard-btn" onClick={() => onDelete(row)}>Send Reset Password Link</button>

        </>
      ),
      sortable: false,
      filterable: false,
    }

  ];

  const [rows, setRows] = useState<User[]>([]);
  const [rowCount, setRowCount] = useState(0);
  const [paginationModel, setPaginationModel] = useState<PaginationModel>({
    page: 1,
    pageSize: 10,
  });
  const [sortModel, setSortModel] = useState<SortModel<User> | null>(null);
  const [filterModel, setFilterModel] = useState<FilterModel<User>[] | null>(
    null
  );
  const [loading, setLoading] = useState(false);

  const fetchUserProfiles = useCallback(async () => {
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

      const response = await axiosInstance.get("/users", { params });

      setRows(response.data.data.users);
      setRowCount(response.data.data.total);
    } catch (err) {
      console.error("Failed to fetch user profiles", err);
    } finally {
      setLoading(false);
    }
  }, [paginationModel, sortModel, filterModel]);

  useEffect(() => {
    fetchUserProfiles();
  }, [fetchUserProfiles]);


  const toggleAuthorization = async (row) => {


    try {
      
      const payload: UpdateUserRequest = {
        name: row.email,
        email: row.email,
        authorize: !row.authorize,
      };


      const response = await updateUser(row._id, payload);

      if (response.success) {
        show({type: "success",          message: response.message});
        fetchUserProfiles();
      }
    } catch (err: any) {
      show({
        type: "error",
        message: err.message,

      });
    } finally {

    }
  };


  return (
    <>
      <h3 className="mb-3">User Profiles</h3>
      <GenericDataGrid<User>
        rows={rows}
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
    </>
  );
};
