export class TsvImp
{
  constructor()
  {
    this.lineSep = '\n';
    this.colSep = ',';
  }

  fromTSV(str)
  {
    try
    {
      str = str.replace(/[\r]+/g, '');
      const linesArr = str.split(this.lineSep);
      const colNames = linesArr.splice(0, 1)[0].split(this.colSep);

      const objs = linesArr.map((line) =>
      {
        const obj = {};
        const values = line.split(this.colSep);
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
    catch (err)
    {
      throw err;
    }
  }

}