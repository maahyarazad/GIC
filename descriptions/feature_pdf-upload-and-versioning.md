# Feature - PDF Upload and Product Versioning

## Description

1. Update **`ModifyContinent.tsx`** by adding a new field named **`productVersion`** to the product. This field should be a nullable string.
2. Allow administrators to update the **`productVersion`** field with values such as **`V1`**, **`V2`**, etc.
3. In the **Actions** column of **`ModifyContinent.tsx`**, add a new action next to **Delete** that allows an administrator to upload a PDF file to **`file_storage`**.
4. After the upload is complete, store the uploaded file's ID in the **`File ID`** field of the corresponding product.


# Bug Fix - Fix Save Continent

## Description

1. The client sends the following payload to the server, but the request fails with a **400 Bad Request** error:


   ```text
   PUT http://localhost:5612/api/v1/continents/6a55fdd16db0edc353e10ba1
   400 (Bad Request)
   ```

   Update the server implementation so that it accepts and correctly processes the payload according to the JSON model below.

2. Refactor the previous implementation of the PDF upload feature (previously described as adding an upload action next to **Delete** in **`ModifyContinent.tsx`**).

   - Create a dedicated API endpoint for uploading PDF files.
   - Save the uploaded file to **`file_storage`** using its original filename.
   - Return the uploaded file's ID so it can be associated with the corresponding product separately from the continent update request.

# Feature - Add Last updated Date to Country Intelligence

## Description:

1. in the **`EconomicInsights.tsx`** add another `span` next to ` <span className="_card-cta">Download report</span>` and view the `fileUpload_timeStamp` value in formatted DD-MMM-YYYY 

2. **`fileUpload_timeStamp`** state changes should propagate to the top parent so the content save the fileUpload_timeStamp value in the 
CountriesSelector -> ModifyContinent -> Continent

```jsx
// Upload a PDF to file_storage and store the returned file id in the product's File ID.
    const handleUploadPdf = useCallback(async (
        index: number,
        e: React.ChangeEvent<HTMLInputElement>
    ) => {
        const file = e.target.files?.[0];
        e.target.value = ""; // allow re-selecting the same file later
        if (!file) return;

        if (file.type !== "application/pdf") {
            notify?.({ type: "error", message: "Please select a PDF file." });
            return;
        }

        try {
            setUploadingIndex(index);
            const formData = new FormData();
            formData.append("file", file);

            // Dedicated PDF endpoint: saves under the original filename and returns
            // the file id (filename without extension) to assign to the product.
            const { data } = await axiosInstance.post("/files/pdf", formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });

            const fileId = data?.data?.fileId;
            if (!fileId) {
                notify?.({ type: "error", message: "Upload failed: no file id returned." });
                return;
            }


            // Store the new file id and stamp the upload time.
            setContinent((prev) => {
                const updatedProducts = [...(prev.productObjects ?? [])];
                updatedProducts[index] = {
                    ...updatedProducts[index],
                    fileId,
                    fileUpload_timeStamp: Date.now(),
                };
                return { ...prev, productObjects: updatedProducts };
            });
            notify?.({ type: "success", message: "PDF uploaded successfully." });
        } catch (err: any) {
            console.error("Failed to upload PDF", err);
            notify?.({ type: "error", message: err?.message || "Failed to upload PDF." });
        } finally {
            setUploadingIndex(null);
        }
    }, [notify, setContinent]);
```