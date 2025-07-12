import React from "react";

const InfoPage = () => {

    let headers = ['Case_id', 'Activity', 'Timestamp', 'Student', 'Lector', 'Group']
    let row1 = ['1', 'Test1 pass', '19.04.2024', 'Ivan I.', 'Petr. P', 'BPI201']
    let row2 = ['2', 'Test1 fail', '19.04.2024', 'Boris B.', 'Petr. P', 'BPI202']
    let row3 = ['3', 'Test2 pass', '21.04.2024', 'Boris B.', 'Petr. P', 'BPI202']
    let row4 = ['4', 'Test2 fail', '21.04.2024', 'Ivan I.', 'Petr. P', 'BPI201']


    return (
      <>
        {
          <>
            <p style={{ padding: "15px" }}>Пример журнала событий:</p>
            <table style={tableStyle}>
            <thead>
                <tr>
                    {headers.map((header) => (
                        <th style={tableHeaderStyle}>
                            {header}
                        </th>
                    ))}
                </tr>
            </thead>
            <tbody>
                <tr>
                    {row1.map((row) => (
                        <td style={tableCellStyle}>
                            {row}
                        </td>
                    ))}
                </tr>
                <tr>
                    {row2.map((row) => (
                        <td style={tableCellStyle}>
                            {row}
                        </td>
                    ))}
                </tr>
                <tr>
                    {row3.map((row) => (
                        <td style={tableCellStyle}>
                            {row}
                        </td>
                    ))}
                </tr>
                <tr>
                    {row4.map((row) => (
                        <td style={tableCellStyle}>
                            {row}
                        </td>
                    ))}
                </tr>
            </tbody>
            </table>
            <p style={{ padding: "15px" }}>Важно! Столбцы "Case_id", "Activity", "Timestamp" являются обязательными.
            Столбцы "Student", "Lector", "Group" являются опциональными.</p>
            <p style={{ padding: "15px", paddingBottom: "8px" }}>Пример списка вершин:</p>
            <table style={tableStyle}>
            <thead>
                <tr>
                    <th style={tableHeaderStyle}>
                        Test1
                    </th>
                    <th style={tableHeaderStyle}>
                        Test2
                    </th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td style={tableCellStyle}>
                        pass
                    </td>
                    <td style={tableCellStyle}>
                        fail
                    </td>
                </tr>
                <tr>
                    <td style={tableCellStyle}>
                        fail
                    </td>
                    <td style={tableCellStyle}>
                        pass
                    </td>
                </tr>
            </tbody>
            </table>
            <p style={{ padding: "15px", paddingBottom: "0px" }}>Важно! Название события в журнале событий должно состоять из двух частей:
            названия столбца и названия вершины в графе</p>
            <p style={{ padding: "15px" }}>Test1 pass (Название события) = Test1 (Название столбца в графе) +
            pass (Название вершины соответствующего столбца)</p>
          </>
        }
      </> 
    );
  };

  const tableStyle = {
    borderCollapse: "collapse",
    width: "100%",
    borderRadius: "10px",
    overflow: "hidden",
    boxShadow: "40px 90px 55px -20px rgba(155, 184, 243, 0.2)",
  };
  
  const tableHeaderStyle = {
    fontSize: "14px",
    fontWeight: 500,
    color: "#ffffff",
    backgroundColor: "#6D95E0",
    borderBottom: "1px solid #ddd",
    padding: "15px",
    textAlign: "left",
  };
  
  const tableCellStyle = {
    fontSize: "14px",
    fontWeight: 500,
    borderBottom: "1px solid #ddd",
    padding: "15px",
    backgroundColor: "#fff",
  };

  export default InfoPage;