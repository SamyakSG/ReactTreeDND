import React, { Component } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Tree, Button, Select, List, Input } from 'antd';
import './App.css';

const { Option } = Select;
const { Search } = Input;

const initialData = [
  { id: '1', title: "Assembly 1", children: [{ id: '1.1', title: "Assembly 1.1" }, { id: '1.2', title: "Assembly 1.2" }] },
  { id: '2', title: "Assembly 2", children: [{ id: '2.1', title: "Assembly 2.1" }, { id: '2.2', title: "Assembly 2.2" }, { id: '2.3', title: "Assembly 2.3" }] }
];

const processList = [
  { id: '4', title: "Process Object 1", sensors: [{ id: '4.1', title: "Sensor 1" }, { id: '4.2', title: "Sensor 2" }] },
  { id: '5', title: "Process Object 2", sensors: [{ id: '5.1', title: "Sensor 3" }, { id: '5.2', title: "Sensor 4" }, { id: '5.3', title: "Sensor 5" }, { id: '5.4', title: "Sensor 6" }, { id: '5.5', title: "Sensor 7" }] },
];

const convertDataToList = (data) => {
  return data.map(item => ({
    title: item.title,
    key: item.id,
    children: item.children ? convertDataToList(item.children) : (item.sensors ? item.sensors.map(sensor => ({ title: sensor.title, key: sensor.id })) : []),
  }));
};

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      gData: [],
      searchInputs: {
        assembly: '',
        subAssembly: '',
        process: '',
        sensors: '',
      },
      selectedItems: {
        assembly: null,
        subAssembly: null,
        process: null,
      },
      columns: {
        assembly: {
          name: "Assembly",
          items: convertDataToList(initialData), // Change here
        },
        subAssembly: {
          name: "Sub-Assembly",
          items: [],
        },
        process: {
          name: "Process",
          items: convertDataToList(processList),
        },
        sensors: {
          name: "Sensors",
          items: [],
        },
      },
      selectedParent: null,
      removedItems: [],
      uniqueSubAssemblies: [],
      selectedParentKey: null,
      filteredAssemblyList: [],
      originalAssemblyList: initialData,
      treeData: [],
      originalColumns: {
        assembly: initialData,
        subAssembly: [],
        process: processList,
        sensors: [],
        subAssemblySearch: '',
        processSearch: '',
      },
    };
  }

  componentDidMount() {
    // Initialize the original columns with the current state
    this.setState({ originalColumns: this.state.columns });
  }

  handleSearchChange = (columnId, e) => {
    const value = e.target.value.toLowerCase();
    this.setState(prevState => ({
      searchInputs: { ...prevState.searchInputs, [columnId]: value },
    }), () => {
      if (columnId === 'subAssembly' || columnId === 'sensors') {
        this.updateFilteredItemsForChildren(columnId, value);
      } else {
        this.updateFilteredItems(columnId, value);
      }
    });
  };

  updateFilteredItemsForChildren = (columnId, searchValue) => {
    const { columns, selectedParentKey, selectedItems } = this.state;

    let originalItems = [];
    if (columnId === 'subAssembly') {
      const selectedParent = initialData.find(parent => parent.id === selectedParentKey);
      originalItems = selectedParent ? convertDataToList(selectedParent.children) : [];
    } else if (columnId === 'sensors') {
      const selectedProcess = processList.find(process => process.id === selectedItems.process);
      originalItems = selectedProcess ? convertDataToList(selectedProcess.sensors) : [];
    }

    let filteredItems = originalItems.filter(item => item.title.toLowerCase().includes(searchValue.toLowerCase()));

    this.setState(prevState => ({
      columns: {
        ...prevState.columns,
        [columnId]: {
          ...prevState.columns[columnId],
          items: filteredItems,
        },
      },
    }));
  };

  updateFilteredItems = (columnId, searchValue) => {
    const { originalColumns, columns } = this.state;

    let filteredItems = [];
    if (searchValue) {
      filteredItems = originalColumns[columnId].items.filter(item => item.title.toLowerCase().includes(searchValue.toLowerCase()));
    } else {
      filteredItems = originalColumns[columnId].items;
    }

    this.setState(prevState => ({
      columns: {
        ...prevState.columns,
        [columnId]: {
          ...prevState.columns[columnId],
          items: filteredItems,
        },
      },
    }));
  };


  renderDroppableList22 = (data, id, emptyMessage, originalList, searchInput) => {
    const isSearchEmpty = searchInput === '';
    const hasItems = data.length > 0;

    return (
      <Droppable droppableId={id}>
        {(provided) => (
          <List
            {...provided.droppableProps}
            ref={provided.innerRef}
            bordered
          >
            {hasItems ? (
              this.renderList(data, originalList)
            ) : (
              <List.Item>
                {isSearchEmpty ? emptyMessage : "No items available."}
              </List.Item>
            )}
            {provided.placeholder}
          </List>
        )}
      </Droppable>
    );
  };


  handleParentChange = (selectedParentId) => {
    const selectedParent = initialData.find(parent => parent.id === selectedParentId);
    const subAssemblyItems = selectedParent ? convertDataToList(selectedParent.children) : [];

    this.setState({
      selectedParentKey: selectedParentId,
      columns: {
        ...this.state.columns,
        subAssembly: {
          ...this.state.columns.subAssembly,
          items: subAssemblyItems,
        },
      },
    });
  };

  handleProcessSelect = (processKey) => {
    const selectedProcess = processList.find(process => process.id === processKey);
    const sensorItems = selectedProcess ? convertDataToList(selectedProcess.sensors) : [];

    this.setState({
      selectedItems: {
        ...this.state.selectedItems,
        process: processKey,
      },
      columns: {
        ...this.state.columns,
        sensors: {
          ...this.state.columns.sensors,
          items: sensorItems,
        },
      },
    });
  };


  uniqueIdCounter = 0;
  onDragEnd = (result) => {
    if (!result.destination) return;

    const { source, destination } = result;
    const { columns, gData } = this.state;

    // Dragging within the same column
    if (source.droppableId === destination.droppableId) {
      const items = Array.from(columns[source.droppableId].items);
      const [removed] = items.splice(source.index, 1);
      items.splice(destination.index, 0, removed);

      this.setState(prevState => ({
        columns: {
          ...prevState.columns,
          [source.droppableId]: {
            ...prevState.columns[source.droppableId],
            items,
          },
        },
      }));
    } else {
      // Dragging from a column to the tree
      const sourceItems = Array.from(columns[source.droppableId].items);
      const [removed] = sourceItems.splice(source.index, 1); // Optionally, just for tree structure

      if (destination.droppableId === 'tree') {
        const newTreeData = [
          ...gData,
          { ...removed, key: `${removed.key}-${this.uniqueIdCounter++}`, children: [] },
        ];
        this.setState({ gData: newTreeData }); // Update the tree with the dragged item
      }

    }
  };

  onDrop = (info) => {
    const dropKey = info.node.key;
    const dragKey = info.dragNode.key;
    const dropPos = info.node.pos.split('-');
    const dropPosition = info.dropPosition - Number(dropPos[dropPos.length - 1]);

    const data = [...this.state.gData];

    let dragObj;
    const loop = (data, key, callback) => {
      for (let i = 0; i < data.length; i++) {
        if (data[i].key === key) {
          return callback(data[i], i, data);
        }
        if (data[i].children) {
          loop(data[i].children, key, callback);
        }
      }
    };

    loop(data, dragKey, (item, index, arr) => {
      arr.splice(index, 1);
      dragObj = item;
    });

    if (!info.dropToGap) {
      loop(data, dropKey, (item) => {
        item.children = item.children || [];
        item.children.unshift(dragObj); // Add to the beginning of children
      });
    } else {
      let ar = [];
      let i;
      loop(data, dropKey, (_item, index, arr) => {
        ar = arr;
        i = index;
      });
      if (dropPosition === -1) {
        ar.splice(i, 0, dragObj);
      } else {
        ar.splice(i + 1, 0, dragObj);
      }
    }

    this.setState({ gData: data });
  };

  handleRemove = (key) => {
    const data = [...this.state.gData];
    let removedItem = null;
    let res = window.confirm('Are you sure you want to remove this node?')
    if (res) console.log(res);
    if (res && data) {
      const loop = (data, keyToRemove) => {
        for (let i = 0; i < data.length; i++) {
          if (data[i].key === keyToRemove) {
            removedItem = data[i];
            data.splice(i, 1); // Remove the item
            return true;
          }
          if (data[i].children) {
            const found = loop(data[i].children, keyToRemove);
            if (found) return true;
          }
        }
        return false;
      };

      // Perform the removal and update state if the item was found
      if (loop(data, key) && removedItem) {
        this.setState(prevState => ({
          gData: data, // Update the tree data
          columns: {
            ...prevState.columns,
            assembly: {
              ...prevState.columns.assembly,
              items: prevState.columns.assembly.items.filter(item => item.key !== removedItem.key),
            },
            subAssembly: {
              ...prevState.columns.subAssembly,
              items: prevState.columns.subAssembly.items.filter(item => item.key !== removedItem.key),
            },
          },
        }));
      }
    }
  };


  renderTreeNodes = (data) => {
    return data.map(item => ({
      title: (
        <span>
          {item.title}
          <Button type="link" onClick={() => this.handleRemove(item.key)} style={{ marginLeft: 8 }}>
            Remove
          </Button>
        </span>
      ),
      key: item.key,
      children: item.children ? this.renderTreeNodes(item.children) : [],
    }));
  };

  renderList = (data) => {
    return data.map((item, index) => (
      <Draggable key={item.key} draggableId={item.key} index={index}>
        {(provided) => (
          <div
            ref={provided.innerRef}
            {...provided.draggableProps}
            {...provided.dragHandleProps}
            className='item-style'
          >
            {item.title}
          </div>
        )}
      </Draggable>
    ));
  };

  renderDroppableContent = (columnId) => {
    const searchInput = this.state.searchInputs[columnId] || '';
    const originalItems = this.state.columns[columnId].items || [];
    let filteredItems = originalItems.filter(item => item.title.toLowerCase().includes(searchInput.toLowerCase()));

    // Adjust filtering for specific columns
    if (columnId === 'subAssembly' && this.state.selectedParentKey) {
      const selectedParent = initialData.find(parent => parent.id === this.state.selectedParentKey);
      filteredItems = filteredItems.filter(item => selectedParent?.children?.some(child => child.id === item.key));
    } else if (columnId === 'sensors' && this.state.selectedItems.process) {
      const selectedProcess = processList.find(process => process.id === this.state.selectedItems.process);
      filteredItems = filteredItems.filter(item => selectedProcess?.sensors?.some(sensor => sensor.id === item.key));
    }

    if (filteredItems.length === 0) {
      if (columnId === 'subAssembly' && !this.state.selectedParentKey) {
        return "Select a parent assembly to see its sub-assemblies.";
      } else if (columnId === 'sensors' && !this.state.selectedItems.process) {
        return "Select a process to see its sensors.";
      } else {
        return "No items found.";
      }
    }

    return filteredItems.map((item, index) => (
      <Draggable key={item.key} draggableId={item.key} index={index}>
        {(provided) => (
          <div
            ref={provided.innerRef}
            {...provided.draggableProps}
            {...provided.dragHandleProps}
            className={`item-list-item ${columnId}-item`}
          >
            {item.title}
          </div>
        )}
      </Draggable>
    ));
  };

  render() {
    return (
      <DragDropContext onDragEnd={this.onDragEnd}>
        <header style={{ padding: '16px', borderBottom: '1px solid #ddd', textAlign: 'center' }}>
          <h1>Drag and Drop Columns to Tree View</h1>
        </header>
        <div style={{ display: 'flex', padding: '16px', width: '100%', boxSizing: 'border-box' }}>

          {Object.entries(this.state.columns).map(([columnId, column]) => (
            <div key={columnId} className='containerList' style={{ flex: 1, margin: '0', padding: '0 8px' }}>
              <h3>{column.name}</h3>
              <Search
                placeholder={`Search ${column.name}`}
                onChange={(e) => this.handleSearchChange(columnId, e)}
                style={{ marginBottom: '10px' }}
                value={this.state.searchInputs[columnId]}
              />
              {columnId === 'subAssembly' && (
                <Select
                  placeholder="Select Parent"
                  style={{ width: '100%', marginBottom: '8px' }}
                  onChange={this.handleParentChange}
                  value={this.state.selectedParentKey || undefined}
                >
                  <Option value="">Select Parent</Option>
                  {initialData.map(option => (
                    <Option key={option.id} value={option.id}>{option.title}</Option>
                  ))}
                </Select>
              )}
              {columnId === 'sensors' && (
                <Select
                  placeholder="Select Process"
                  style={{ width: '100%', marginTop: '8px' }}
                  onChange={this.handleProcessSelect}
                  value={this.state.selectedItems.process}
                >
                  <Option value="">Select Process</Option>
                  {processList.map(item => (
                    <Option key={item.id} value={item.id}>
                      {item.title}
                    </Option>
                  ))}
                </Select>
              )}
              <Droppable droppableId={columnId}>
                {(provided) => (
                  <div className='listItem'
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    style={{
                      border: '1px solid rgb(204, 204, 204)',
                      padding: '8px',
                      minHeight: '50px',
                      maxHeight: '180px',
                      overflowY: 'auto',
                    }}
                  >
                    {this.renderDroppableContent(columnId)}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>


            </div>
          ))}
        </div>

        <Droppable droppableId="tree">
          {(provided) => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              style={{
                background: 'lightblue',
                padding: '16px',
                margin: '16px 0',
                width: '100%',
                minHeight: '400px',
              }}
            >
              <h3>Drop Here for Tree Structure</h3>
              <Tree
                treeData={this.renderTreeNodes(this.state.gData)}
                draggable
                blockNode
                onDrop={this.onDrop}
              />
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
    );
  }
}

export default App;