import React from 'react'
import styled from 'styled-components'
import { useTable } from 'react-table'
import { DndProvider, useDrag, useDrop } from 'react-dnd'
import {HTML5Backend} from 'react-dnd-html5-backend'
import update from 'immutability-helper'

import makeData from './makeData'

const Styles = styled.div`
  padding: 1rem;

  table {
    border-spacing: 0;
    border: 1px solid black;

    tr {
      :last-child {
        td {
          border-bottom: 0;
        }
      }
    }

    th,
    td {
      margin: 0;
      padding: 0.5rem;
      border-bottom: 1px solid black;
      border-right: 1px solid black;

      :last-child {
        border-right: 0;
      }
    }
  }
`

const Table = ({ columns, data }) => {
  const [records, setRecords] = React.useState(data)

  const getRowId = React.useCallback(row => {
    return row.id
  }, [])

  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    rows,
    prepareRow,
  } = useTable({
    data: records,
    columns,
    getRowId,
  })

  const moveRow = (dragIndex, hoverIndex) => {
    const dragRecord = records[dragIndex]
    setRecords(
        update(records, {
          $splice: [
            [dragIndex, 1],
            [hoverIndex, 0, dragRecord],
          ],
        })
    )
  }

  return (
      <DndProvider backend={HTML5Backend}>
        <table {...getTableProps()}>
          <thead>
          {headerGroups.map(headerGroup => (
              <tr {...headerGroup.getHeaderGroupProps()}>
                {headerGroup.headers.map(column => (
                    <th {...column.getHeaderProps()}>{column.render('Header')}</th>
                ))}
              </tr>
          ))}
          </thead>
          <tbody {...getTableBodyProps()}>
          {rows.map(
              (row, index) =>
                  prepareRow(row) || (
                      <Row
                          index={index}
                          row={row}
                          moveRow={moveRow}
                          {...row.getRowProps()}
                      />
                  )
          )}
          </tbody>
        </table>
      </DndProvider>
  )
}

const DND_ITEM_TYPE = 'row'

const Row = ({ row, index, moveRow }) => {
  const dndRef = React.useRef(null)

  const [, drop] = useDrop(() => ({
    accept: DND_ITEM_TYPE,
    hover(item, monitor) {
      if (!dndRef.current) {
        return
      }
      const dragIndex = item.index
      const hoverIndex = index

      // Don't replace items with themselves
      if (dragIndex === hoverIndex) {
        return
      }

      // Determine rectangle on screen
      const hoverBoundingRect = dndRef.current.getBoundingClientRect()

      // Get vertical middle
      const hoverMiddleY =
          (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2

      // Determine mouse position
      const clientOffset = monitor.getClientOffset()

      // Get pixels to the top
      const hoverClientY = clientOffset.y - hoverBoundingRect.top

      // Only perform the move when the mouse has crossed half of the items height
      // When dragging downwards, only move when the cursor is below 50%
      // When dragging upwards, only move when the cursor is above 50%
      // Dragging downwards
      if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) {
        return
      }
      // Dragging upwards
      if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) {
        return
      }

      // Time to actually perform the action
      moveRow(dragIndex, hoverIndex)

      // Note: we're mutating the monitor item here!
      // Generally it's better to avoid mutations,
      // but it's good here for the sake of performance
      // to avoid expensive index searches.
      item.index = hoverIndex
    },
  }), [row, index])

  const [{ isDragging }, drag, preview] = useDrag(() => {
    return ({
      type: DND_ITEM_TYPE,
      item: { index },
      collect: monitor => ({
        isDragging: monitor.isDragging(),
      }),
    })
  }, [row, index])

  const opacity = isDragging ? 0.2 : 1

  preview(drop(dndRef))
  drag(dndRef)

  return (
      <tr ref={dndRef} style={{ opacity }}>
        {row.cells.map(cell => {
          return <td {...cell.getCellProps()}>{cell.render('Cell')}</td>
        })}
      </tr>
  )
}

const App = () => {
  const columns = React.useMemo(
      () => [
        {
          Header: 'ID',
          accessor: 'id',
        },
        {
          Header: 'Name',
          columns: [
            {
              Header: 'First Name',
              accessor: 'firstName',
            },
            {
              Header: 'Last Name',
              accessor: 'lastName',
            },
          ],
        },
        {
          Header: 'Info',
          columns: [
            {
              Header: 'Age',
              accessor: 'age',
            },
            {
              Header: 'Visits',
              accessor: 'visits',
            },
            {
              Header: 'Status',
              accessor: 'status',
            },
            {
              Header: 'Profile Progress',
              accessor: 'progress',
            },
          ],
        },
      ],
      []
  )

  const data = React.useMemo(() => makeData(20), [])

  return (
      <Styles>
        <Table columns={columns} data={data} />
      </Styles>
  )
}

export default App
