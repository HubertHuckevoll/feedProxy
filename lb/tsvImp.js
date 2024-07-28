const lineSep = '\n';
const colSep = ',';

export function fromTSV(str)
{
  str = str.replace(/[\r]+/g, '');
  str = str.trim();
  const linesArr = str.split(lineSep);
  const colNames = linesArr.splice(0, 1)[0].split(colSep);

  const objs = linesArr.map((line) =>
  {
    const obj = {};
    const values = line.split(colSep);
    for (let i = 0; i < values.length; i++)
    {
      let value = values[i];
      if ((value === 'true')  || (value === 'TRUE'))  value = true;
      if ((value === 'false') || (value === 'FALSE')) value = false;
      obj[colNames[i]] = value;
    }
    return obj;
  });

  return objs;
}